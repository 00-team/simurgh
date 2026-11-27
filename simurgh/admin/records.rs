use crate::dar;
use crate::docs::UpdatePaths;
use crate::models::Horp;
use crate::models::blog::Blog;
use crate::models::user::Admin;
use crate::state::SimurghDb;
use actix_web::web::Data;
use actix_web::{HttpResponse, Scope, post};
use utoipa::OpenApi;

#[derive(OpenApi)]
#[openapi(
    tags((name = "admin::records")),
    paths(r_task_update_usage),
    components(schemas()),
    servers((url = "/records")),
    modifiers(&UpdatePaths)
)]
pub struct ApiDoc;

#[utoipa::path(post, responses((status = 200)))]
/// Task Update Usage
#[post("/task-update-usage/")]
async fn r_task_update_usage(_: Admin, db: Data<SimurghDb>) -> Horp {
    let blogs = sqlx::query_as! {Blog, "select * from blogs"}
        .fetch_all(&db.sql)
        .await?;

    for b in blogs {
        dar::blog_add_record_usages(&b, &db.sql).await;
    }

    Ok(HttpResponse::Ok().finish())
}

pub fn router() -> Scope {
    Scope::new("/records").service(r_task_update_usage)
}
