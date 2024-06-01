use actix_web::web::{Data, Json, Query};
use actix_web::{get, post, Scope};
use serde::Deserialize;
use utoipa::{OpenApi, ToSchema};

use crate::docs::UpdatePaths;
use crate::models::project::Project;
use crate::models::user::User;
use crate::models::{ListInput, Response};
use crate::AppState;
use crate::utils;

#[derive(OpenApi)]
#[openapi(
    tags((name = "api::projects")),
    paths(
        projects_new, projects_list
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
        "insert into projects(user, name, timestamp) values(?, ?, ?)",
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

pub fn router() -> Scope {
    Scope::new("/projects").service(projects_new).service(projects_list)
}
