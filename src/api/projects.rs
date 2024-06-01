use actix_web::web::{Data, Json, Query};
use actix_web::{get, patch, post, Scope};
use serde::Deserialize;
use utoipa::{OpenApi, ToSchema};

use crate::docs::UpdatePaths;
use crate::models::project::Project;
use crate::models::user::User;
use crate::models::{AppErrNotFound, ListInput, Response};
use crate::utils;
use crate::AppState;

#[derive(OpenApi)]
#[openapi(
    tags((name = "api::projects")),
    paths(
        projects_new, projects_list, projects_get, projects_update
    ),
    components(schemas(Project, NewBody)),
    servers((url = "/projects")),
    modifiers(&UpdatePaths)
)]
pub struct ApiDoc;

#[derive(Deserialize, ToSchema)]
struct NewBody {
    name: String,
}

#[utoipa::path(
    post,
    request_body = NewBody,
    responses((status = 200, body = Project))
)]
/// New
#[post("/")]
async fn projects_new(
    user: User, body: Json<NewBody>, state: Data<AppState>,
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

pub fn router() -> Scope {
    Scope::new("/projects")
        .service(projects_new)
        .service(projects_list)
        .service(projects_get)
        .service(projects_update)
}
