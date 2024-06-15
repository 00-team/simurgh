use actix_web::web::{Data, Json, Query};
use actix_web::{delete, get, patch, post, HttpResponse, Scope};
use serde::Deserialize;
use utoipa::{OpenApi, ToSchema};

use crate::docs::UpdatePaths;
use crate::models::blog::{Blog, BlogContent};
use crate::models::project::Project;
use crate::models::user::User;
use crate::models::{ListInput, Response};
use crate::{utils, AppState};

#[derive(OpenApi)]
#[openapi(
    tags((name = "api::blog_contents")),
    paths(
        content_list, content_get
    ),
    components(schemas(BlogContent)),
    servers((url = "/projects/{pid}/blogs/{bid}/contents")),
    modifiers(&UpdatePaths)
)]
pub struct ApiDoc;

#[utoipa::path(
    get,
    params(
        ("pid" = i64, Path, example = 1),
        ("bid" = i64, Path, example = 1),
        ListInput
    ),
    responses((status = 200, body = Vec<BlogContent>))
)]
/// List
#[get("/")]
async fn content_list(
    blog: Blog, q: Query<ListInput>, state: Data<AppState>,
) -> Response<Vec<BlogContent>> {
    let offset = q.page * 32;
    let result = sqlx::query_as! {
        BlogContent,
        "select * from blog_contents where blog = ? order by id desc limit 32 offset ?",
        blog.id, offset
    }
    .fetch_all(&state.sql)
    .await?;

    Ok(Json(result))
}

// #[derive(Deserialize, ToSchema)]
// struct BlogAddBody {
//     slug: String,
// }
//
// #[utoipa::path(
//     post,
//     params(("pid" = i64, Path, example = 1)),
//     request_body = BlogAddBody,
//     responses((status = 200, body = Blog))
// )]
// /// Add
// #[post("/")]
// async fn blogs_add(
//     user: User, project: Project, body: Json<BlogAddBody>, state: Data<AppState>,
// ) -> Response<Blog> {
//     let now = utils::now();
//     sqlx::query! {
//         "insert into blogs(slug, project, author, created_at) values(?,?,?,?)",
//         body.slug, project.id, user.id, now
//     }
//     .execute(&state.sql)
//     .await?;
//
//     Ok(Json(Blog {
//         slug: body.slug.clone(),
//         project: project.id,
//         author: user.id,
//         created_at: now,
//         ..Default::default()
//     }))
// }

#[utoipa::path(
    get,
    params(
        ("pid" = i64, Path, example = 1),
        ("bid" = i64, Path, example = 1),
        ("cid" = i64, Path, example = 1),
    ),
    responses((status = 200, body = BlogContent))
)]
/// Get
#[get("/{cid}/")]
async fn content_get(content: BlogContent) -> Response<BlogContent> {
    Ok(Json(content))
}

// #[derive(Deserialize, ToSchema)]
// struct UpdateBody {
//     name: String,
// }
//
// #[utoipa::path(
//     patch,
//     params(("id" = i64, Path, example = 1)),
//     request_body = UpdateBody,
//     responses((status = 200, body = Project))
// )]
// /// Update
// #[patch("/{id}/")]
// async fn projects_update(
//     user: User, project: Project, body: Json<UpdateBody>, state: Data<AppState>,
// ) -> Response<Project> {
//     let mut project = project;
//     if project.user != user.id {
//         return Err(AppErrNotFound("پروژه یافت نشد"));
//     }
//
//     let now = utils::now();
//     sqlx::query! {
//         "update projects set name = ?, updated_at = ? where id = ?",
//         body.name, now, project.id,
//     }
//     .execute(&state.sql)
//     .await?;
//
//     project.name = body.name.clone();
//     project.updated_at = now;
//
//     Ok(Json(project))
// }
//
// #[utoipa::path(
//     delete,
//     params(("id" = i64, Path,)),
//     responses((status = 200))
// )]
// /// Delete
// #[delete("/{id}/")]
// async fn projects_delete(
//     user: User, project: Project, state: Data<AppState>,
// ) -> Result<HttpResponse, AppErr> {
//     if project.user != user.id {
//         return Err(AppErrNotFound("پروژه یافت نشد"));
//     }
//
//     let records = sqlx::query_as! {
//         Record,
//         "select * from records where project = ? OR project = null",
//         project.id,
//     }
//     .fetch_all(&state.sql)
//     .await?;
//
//     for r in records {
//         utils::remove_record(&format!("r:{}:{}", r.id, r.salt));
//     }
//
//     sqlx::query! {
//         "delete from records where project = ? OR project = null",
//         project.id,
//     }
//     .execute(&state.sql)
//     .await?;
//
//     sqlx::query! {
//         "delete from projects where id = ?",
//         project.id,
//     }
//     .execute(&state.sql)
//     .await?;
//
//     Ok(HttpResponse::Ok().finish())
// }

pub fn router() -> Scope {
    Scope::new("/{bid}/contents")
        .service(content_list)
        // .service(content_add)
        .service(content_get)
}
