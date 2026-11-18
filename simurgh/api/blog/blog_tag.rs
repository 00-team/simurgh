use actix_web::web::{Data, Json, Path};
use actix_web::{HttpResponse, Scope, delete, get, post};
use serde::Deserialize;
use utoipa::{OpenApi, ToSchema};

use crate::docs::UpdatePaths;
use crate::models::blog::{Blog, BlogTag};
use crate::models::{AppErr, Response};
use crate::state::SimurghDb;

#[derive(OpenApi)]
#[openapi(
    tags((name = "api::blog_tag")),
    paths(blog_tag_list, blog_tag_add, blog_tag_delete),
    components(schemas(BlogTagAddBody)),
    servers((url = "/projects/{pid}/blogs/{bid}/tags")),
    modifiers(&UpdatePaths)
)]
pub struct ApiDoc;

#[utoipa::path(
    get,
    params(("pid" = i64, Path, example = 1), ("bid" = i64, Path, example = 1)),
    responses((status = 200, body = Vec<BlogTag>))
)]
/// List
#[get("/")]
async fn blog_tag_list(
    blog: Blog, db: Data<SimurghDb>,
) -> Response<Vec<BlogTag>> {
    let result = sqlx::query_as! {
        BlogTag,
        "select * from blog_tags where id in
        (select tag from blog_tag where blog = ?)",
        blog.id
    }
    .fetch_all(&db.sql)
    .await?;

    Ok(Json(result))
}

#[derive(Deserialize, ToSchema)]
struct BlogTagAddBody {
    tag: i64,
}

#[utoipa::path(
    post,
    params(("pid" = i64, Path, example = 1), ("bid" = i64, Path, example = 1)),
    responses((status = 200))
)]
/// Add
#[post("/")]
async fn blog_tag_add(
    blog: Blog, body: Json<BlogTagAddBody>, db: Data<SimurghDb>,
) -> Result<HttpResponse, AppErr> {
    sqlx::query! {
        "insert into blog_tag(blog, tag) values(?, ?)",
        blog.id, body.tag
    }
    .execute(&db.sql)
    .await?;

    sqlx::query! {
        "update blog_tags set count = count + 1 where id = ?",
        body.tag
    }
    .execute(&db.sql)
    .await?;

    Ok(HttpResponse::Ok().finish())
}

#[utoipa::path(
    delete,
    params(
        ("pid" = i64, Path, example = 1),
        ("bid" = i64, Path, example = 1),
        ("btid" = i64, Path, example = 1)
    ),
    responses((status = 200))
)]
/// Delete
#[delete("/{btid}/")]
async fn blog_tag_delete(
    blog: Blog, path: Path<(i64, i64, i64)>, db: Data<SimurghDb>,
) -> Result<HttpResponse, AppErr> {
    let result = sqlx::query! {
        "delete from blog_tag where blog = ? AND tag = ?",
        blog.id, path.2
    }
    .execute(&db.sql)
    .await?;

    if result.rows_affected() != 0 {
        sqlx::query! {
            "update blog_tags set count = count - 1 where id = ?",
            path.2
        }
        .execute(&db.sql)
        .await?;
    }

    Ok(HttpResponse::Ok().finish())
}

pub fn router() -> Scope {
    Scope::new("/{bid}/tags")
        .service(blog_tag_add)
        .service(blog_tag_list)
        .service(blog_tag_delete)
}
