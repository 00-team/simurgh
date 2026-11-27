use actix_web::web::{Data, Json, Query};
use actix_web::{HttpResponse, Scope, delete, get, patch, post};
use media::{RecordPath, RecordPathKind};
use nest::utils::random_string;
use serde::Deserialize;
use utoipa::{OpenApi, ToSchema};

use crate::config::Config;
use crate::docs::UpdatePaths;
use crate::models::project::Project;
use crate::models::record::{Record, RecordKind};
use crate::models::user::User;
use crate::models::{AppErr, ListInput, Response};
use crate::state::SimurghDb;
use crate::utils::CutOff;

#[derive(OpenApi)]
#[openapi(
    tags((name = "api::projects")),
    paths(r_add, r_list, r_get, r_update, r_delete),
    components(schemas(Project, ProjectAddBody, ProjectUpdateBody)),
    servers((url = "/projects")),
    modifiers(&UpdatePaths)
)]
pub struct ApiDoc;

#[derive(Deserialize, ToSchema)]
struct ProjectAddBody {
    name: String,
}

#[utoipa::path(
    post,
    request_body = ProjectAddBody,
    responses((status = 200, body = Project))
)]
/// Add
#[post("/")]
async fn r_add(
    user: User, body: Json<ProjectAddBody>, db: Data<SimurghDb>,
) -> Response<Project> {
    if !cfg!(debug_assertions) && !user.client {
        return nest::err!(Forbidden, "not a client");
    }

    let api_key = random_string(Config::API_KEY_ABC, 40);

    let now = nest::sys_now() as i64;
    sqlx::query! {
        "insert into projects(owner, name, created_at, api_key) values(?,?,?,?)",
        user.id, body.name, now, api_key
    }
    .execute(&db.sql)
    .await?;

    Ok(Json(Project {
        owner: Some(user.id),
        name: body.name.clone(),
        created_at: now,
        api_key: Some(api_key),
        ..Default::default()
    }))
}

#[utoipa::path(
    get,
    params(ListInput),
    responses((status = 200, body = Vec<Project>))
)]
/// List
#[get("/")]
async fn r_list(
    user: User, q: Query<ListInput>, db: Data<SimurghDb>,
) -> Response<Vec<Project>> {
    let offset = q.page * 32;
    let result = sqlx::query_as! {
        Project,
        "select * from projects where owner = ? order by id desc limit 32 offset ?",
        user.id, offset
    }
    .fetch_all(&db.sql)
    .await?;

    Ok(Json(result))
}

#[utoipa::path(
    get,
    params(("id" = i64, Path, example = 1)),
    responses((status = 200, body = Project))
)]
/// Get
#[get("/{id}/")]
async fn r_get(project: Project) -> Response<Project> {
    Ok(Json(project))
}

#[derive(Deserialize, ToSchema)]
struct ProjectUpdateBody {
    name: String,
    api_key: Option<bool>,
}

#[utoipa::path(
    patch,
    params(("id" = i64, Path, example = 1)),
    request_body = ProjectUpdateBody,
    responses((status = 200, body = Project))
)]
/// Update
#[patch("/{id}/")]
async fn r_update(
    project: Project, body: Json<ProjectUpdateBody>, db: Data<SimurghDb>,
) -> Response<Project> {
    let mut project = project;

    project.name.clone_from(&body.name);
    project.name.cut_off(255);
    project.updated_at = nest::sys_now() as i64;

    if let Some(ak) = body.api_key {
        if ak {
            project.api_key = Some(random_string(Config::API_KEY_ABC, 42));
        } else {
            project.api_key = None;
        }
    }

    sqlx::query! {
        "update projects set name = ?, updated_at = ?, api_key = ? where id = ?",
        project.name, project.updated_at, project.api_key, project.id,
    }
    .execute(&db.sql)
    .await?;

    Ok(Json(project))
}

#[utoipa::path(
    delete,
    params(("id" = i64, Path,)),
    responses((status = 200))
)]
/// Delete
#[delete("/{id}/")]
async fn r_delete(
    project: Project, db: Data<SimurghDb>,
) -> Result<HttpResponse, AppErr> {
    {
        let records = sqlx::query_as! {
            Record,
            "select * from records where project = ?",
            project.id,
        }
        .fetch_all(&db.sql)
        .await?;

        for r in records {
            use RecordPathKind::*;
            let pid = project.id;
            match r.kind {
                RecordKind::Video => {
                    RecordPath::new(r.id, r.salt.clone(), Mp4, pid).delete();
                    RecordPath::new(r.id, r.salt, M3u8, pid).delete();
                }
                RecordKind::Photo => {
                    RecordPath::new(r.id, r.salt, Webp, pid).delete();
                }
                RecordKind::Audio => {
                    RecordPath::new(r.id, r.salt, Opus, pid).delete();
                }
            };
        }

        sqlx::query! {
            "delete from records where project = ?",
            project.id,
        }
        .execute(&db.sql)
        .await?;
    }

    // {
    //     let blogs = sqlx::query_as! {
    //         Blog,
    //         "select * from blogs where project = ?",
    //         project.id,
    //     }
    //     .fetch_all(&db.sql)
    //     .await?;
    //
    //     // for b in blogs {
    //     //     if let Some(t) = b.thumbnail {
    //     //         utils::remove_record(&format!("bt-{}-{t}", b.id));
    //     //     }
    //     // }
    //
    //     sqlx::query! {
    //         "delete from blogs where project = ?",
    //         project.id,
    //     }
    //     .execute(&db.sql)
    //     .await?;
    // }

    sqlx::query! {
        "delete from projects where id = ?",
        project.id,
    }
    .execute(&db.sql)
    .await?;

    Ok(HttpResponse::Ok().finish())
}

pub fn router() -> Scope {
    Scope::new("/projects")
        .service(r_add)
        .service(r_list)
        .service(r_get)
        .service(r_update)
        .service(r_delete)
        .service(super::blog::blogs::router())
        .service(super::blog::categories::router())
        .service(super::blog::sitemap::router())
        .service(super::blog::ssr::router())
        .service(super::blog::tags::router())
        .service(super::records::router())
}
