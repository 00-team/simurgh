use actix_web::web::{Data, Json};
use actix_web::{post, Scope};
use serde::Deserialize;
use utoipa::{OpenApi, ToSchema};

use crate::docs::UpdatePaths;
use crate::models::project::Project;
use crate::models::user::User;
use crate::models::Response;
use crate::AppState;

#[derive(OpenApi)]
#[openapi(
    tags((name = "api::projects")),
    paths(
        projects_new
    ),
    components(schemas(Project)),
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
    sqlx::query! {
        "insert into projects(user, name) values(?, ?)",
        user.id, body.name
    }
    .execute(&state.sql)
    .await?;

    Ok(Json(Project {
        user: user.id,
        name: body.name.clone(),
        ..Default::default()
    }))
}

pub fn router() -> Scope {
    Scope::new("/projects").service(projects_new)
}
