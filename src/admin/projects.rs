use actix_web::web::{Data, Json, Query};
use actix_web::{get, Scope};
use utoipa::OpenApi;

use crate::docs::UpdatePaths;
use crate::models::project::Project;
use crate::models::user::Admin;
use crate::models::{ListInput, Response};
use crate::AppState;

#[derive(OpenApi)]
#[openapi(
    tags((name = "admin::projects")),
    paths(projects_list),
    components(schemas()),
    servers((url = "/projects")),
    modifiers(&UpdatePaths)
)]
pub struct ApiDoc;

#[utoipa::path(
    get,
    params(ListInput),
    responses((status = 200, body = Vec<Project>))
)]
/// List
#[get("/")]
async fn projects_list(
    _: Admin, q: Query<ListInput>, state: Data<AppState>,
) -> Response<Vec<Project>> {
    let offset = q.page * 32;
    let result = sqlx::query_as! {
        Project,
        "select * from projects order by id desc limit 32 offset ?",
        offset
    }
    .fetch_all(&state.sql)
    .await?;

    Ok(Json(result))
}

pub fn router() -> Scope {
    Scope::new("/projects").service(projects_list)
}
