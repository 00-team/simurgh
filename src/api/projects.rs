use actix_web::web::{Data, Json, Query};
use actix_web::{delete, get, patch, post, HttpResponse, Scope};
use rand::Rng;
use serde::Deserialize;
use utoipa::{OpenApi, ToSchema};

use crate::config::Config;
use crate::docs::UpdatePaths;
use crate::models::blog::Blog;
use crate::models::project::Project;
use crate::models::record::Record;
use crate::models::user::User;
use crate::models::{AppErr, AppErrForbidden, ListInput, Response};
use crate::utils::{self, CutOff};
use crate::AppState;

#[derive(OpenApi)]
#[openapi(
    tags((name = "api::projects")),
    paths(
        projects_add, projects_list, projects_get, projects_update,
        projects_delete
    ),
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
async fn projects_add(
    user: User, body: Json<ProjectAddBody>, state: Data<AppState>,
) -> Response<Project> {
    if !cfg!(debug_assertions) && !user.client {
        return Err(AppErrForbidden(Some("you are not a Client")));
    }

    let api_key = utils::get_random_string(
        Config::API_KEY_ABC,
        rand::thread_rng().gen_range(42..69),
    );
    let now = utils::now();
    sqlx::query! {
        "insert into projects(user, name, created_at, api_key) values(?,?,?,?)",
        user.id, body.name, now, api_key
    }
    .execute(&state.sql)
    .await?;

    Ok(Json(Project {
        user: Some(user.id),
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
async fn projects_list(
    user: User, q: Query<ListInput>, state: Data<AppState>,
) -> Response<Vec<Project>> {
    let offset = q.page * 32;
    let result = sqlx::query_as! {
        Project,
        "select * from projects where user = ? order by id desc limit 32 offset ?",
        user.id, offset
    }
    .fetch_all(&state.sql)
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
async fn projects_get(project: Project) -> Response<Project> {
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
async fn projects_update(
    project: Project, body: Json<ProjectUpdateBody>, state: Data<AppState>,
) -> Response<Project> {
    let mut project = project;

    project.name.clone_from(&body.name);
    project.name.cut_off(255);
    project.updated_at = utils::now();

    if let Some(ak) = body.api_key {
        if ak {
            project.api_key = Some(utils::get_random_string(
                Config::API_KEY_ABC,
                rand::thread_rng().gen_range(42..69),
            ));
        } else {
            project.api_key = None;
        }
    }

    sqlx::query! {
        "update projects set name = ?, updated_at = ?, api_key = ? where id = ?",
        project.name, project.updated_at, project.api_key, project.id,
    }
    .execute(&state.sql)
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
async fn projects_delete(
    project: Project, state: Data<AppState>,
) -> Result<HttpResponse, AppErr> {
    {
        let records = sqlx::query_as! {
            Record,
            "select * from records where project = ? OR project = null",
            project.id,
        }
        .fetch_all(&state.sql)
        .await?;

        for r in records {
            utils::remove_record(&format!("r-{}-{}", r.id, r.salt));
        }

        sqlx::query! {
            "delete from records where project = ? OR project = null",
            project.id,
        }
        .execute(&state.sql)
        .await?;
    }

    {
        let blogs = sqlx::query_as! {
            Blog,
            "select * from blogs where project = ? OR project = null",
            project.id,
        }
        .fetch_all(&state.sql)
        .await?;

        for b in blogs {
            if let Some(t) = b.thumbnail {
                utils::remove_record(&format!("bt-{}-{t}", b.id));
            }
        }

        sqlx::query! {
            "delete from blogs where project = ? OR project = null",
            project.id,
        }
        .execute(&state.sql)
        .await?;
    }

    sqlx::query! {
        "delete from projects where id = ?",
        project.id,
    }
    .execute(&state.sql)
    .await?;

    Ok(HttpResponse::Ok().finish())
}

pub fn router() -> Scope {
    Scope::new("/projects")
        .service(projects_add)
        .service(projects_list)
        .service(projects_get)
        .service(projects_update)
        .service(projects_delete)
        .service(super::blog::blogs::router())
        .service(super::blog::categories::router())
        .service(super::blog::sitemap::router())
        .service(super::blog::ssr::router())
        .service(super::blog::tags::router())
        .service(super::records::router())
}
