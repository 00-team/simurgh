use actix_web::web::{Data, Json, Query};
use actix_web::{delete, get, patch, post, HttpResponse, Scope};
use serde::Deserialize;
use utoipa::{OpenApi, ToSchema};

use crate::docs::UpdatePaths;
use crate::models::project::Project;
use crate::models::record::Record;
use crate::models::user::User;
use crate::models::{AppErr, AppErrNotFound, ListInput, Response};
use crate::utils;
use crate::AppState;

#[derive(OpenApi)]
#[openapi(
    tags((name = "api::projects")),
    paths(
        projects_add, projects_list, projects_get, projects_update,
        projects_delete
    ),
    components(schemas(Project, ProjectAddBody)),
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
    let now = utils::now();
    sqlx::query! {
        "insert into projects(user, name, created_at) values(?, ?, ?)",
        user.id, body.name, now
    }
    .execute(&state.sql)
    .await?;

    Ok(Json(Project {
        user: user.id,
        name: body.name.clone(),
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
async fn projects_get(user: User, project: Project) -> Response<Project> {
    if project.user != user.id {
        return Err(AppErrNotFound("پروژه یافت نشد"));
    }
    Ok(Json(project))
}

#[derive(Deserialize, ToSchema)]
struct UpdateBody {
    name: String,
}

#[utoipa::path(
    patch,
    params(("id" = i64, Path, example = 1)),
    request_body = UpdateBody,
    responses((status = 200, body = Project))
)]
/// Update
#[patch("/{id}/")]
async fn projects_update(
    user: User, project: Project, body: Json<UpdateBody>, state: Data<AppState>,
) -> Response<Project> {
    let mut project = project;
    if project.user != user.id {
        return Err(AppErrNotFound("پروژه یافت نشد"));
    }

    let now = utils::now();
    sqlx::query! {
        "update projects set name = ?, updated_at = ? where id = ?",
        body.name, now, project.id,
    }
    .execute(&state.sql)
    .await?;

    project.name = body.name.clone();
    project.updated_at = now;

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
    user: User, project: Project, state: Data<AppState>,
) -> Result<HttpResponse, AppErr> {
    if project.user != user.id {
        return Err(AppErrNotFound("پروژه یافت نشد"));
    }

    let records = sqlx::query_as! {
        Record,
        "select * from records where project = ? OR project = null",
        project.id,
    }
    .fetch_all(&state.sql)
    .await?;

    for r in records {
        utils::remove_record(&format!("r:{}:{}", r.id, r.salt));
    }

    sqlx::query! {
        "delete from records where project = ? OR project = null",
        project.id,
    }
    .execute(&state.sql)
    .await?;

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
        .service(super::blogs::router())
        .service(super::records::router())
}
