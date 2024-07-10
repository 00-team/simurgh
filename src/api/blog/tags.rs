use actix_web::web::{Data, Json, Query};
use actix_web::{delete, get, patch, post, HttpResponse, Scope};
use serde::Deserialize;
use utoipa::{OpenApi, ToSchema};

use crate::config::Config;
use crate::docs::UpdatePaths;
use crate::models::blog::BlogTag;
use crate::models::project::Project;
use crate::models::{AppErr, ListInput, Response};
use crate::utils::CutOff;
use crate::{utils, AppState};

#[derive(OpenApi)]
#[openapi(
    tags((name = "api::blog-tags")),
    paths(tag_list, tag_add, tag_get, tag_update, tag_delete),
    components(schemas(BlogTag, BlogTagUpdateBody)),
    servers((url = "/projects/{pid}/blog-tags")),
    modifiers(&UpdatePaths)
)]
pub struct ApiDoc;

#[utoipa::path(
    get,
    params(("pid" = i64, Path, example = 1), ListInput),
    responses((status = 200, body = Vec<BlogTag>))
)]
/// List
#[get("/")]
async fn tag_list(
    project: Project, q: Query<ListInput>, state: Data<AppState>,
) -> Response<Vec<BlogTag>> {
    let offset = q.page * 32;
    let result = sqlx::query_as! {
        BlogTag,
        "select * from blog_tags where project = ? order by id desc limit 32 offset ?",
        project.id, offset
    }
    .fetch_all(&state.sql)
    .await?;

    Ok(Json(result))
}

#[utoipa::path(
    post,
    params(("pid" = i64, Path, example = 1)),
    responses((status = 200, body = BlogTag))
)]
/// Add
#[post("/")]
async fn tag_add(project: Project, state: Data<AppState>) -> Response<BlogTag> {
    let mut tries = 0;
    let (id, slug) = loop {
        let slug = format!(
            "{}-{}",
            project.blog_tag_count,
            utils::get_random_string(Config::SLUG_ABC, 16)
        );
        let result = sqlx::query! {
            "insert into blog_tags(slug, project, label) values(?,?,'')",
            slug, project.id
        }
        .execute(&state.sql)
        .await;

        if let Ok(result) = result {
            break (result.last_insert_rowid(), slug);
        }

        tries += 1;
        if tries > 3 {
            return Err(AppErr::default());
        }
    };

    sqlx::query! {
        "update projects set blog_tag_count = blog_tag_count + 1
        where id = ?", project.id
    }
    .execute(&state.sql)
    .await?;

    Ok(Json(BlogTag { id, slug, project: project.id, ..Default::default() }))
}

#[utoipa::path(
    get,
    params(("pid" = i64, Path, example = 1), ("btid" = i64, Path, example = 1)),
    responses((status = 200, body = BlogTag))
)]
/// Get
#[get("/{btid}/")]
async fn tag_get(tag: BlogTag) -> Response<BlogTag> {
    Ok(Json(tag))
}

#[derive(Deserialize, ToSchema)]
struct BlogTagUpdateBody {
    slug: String,
    label: String,
    detail: String,
}

#[utoipa::path(
    patch,
    params(("pid" = i64, Path, example = 1), ("btid" = i64, Path, example = 1)),
    request_body = BlogTagUpdateBody,
    responses((status = 200, body = BlogTag))
)]
/// Update
#[patch("/{btid}/")]
async fn tag_update(
    tag: BlogTag, body: Json<BlogTagUpdateBody>, state: Data<AppState>,
) -> Response<BlogTag> {
    let mut tag = tag;

    utils::verify_slug(&body.slug)?;

    tag.slug = body.slug.clone();
    tag.slug.cut_off(255);
    tag.label = body.label.clone();
    tag.label.cut_off(255);
    tag.detail = body.detail.clone();
    tag.detail.cut_off(2047);

    sqlx::query! {
        "update blog_tags set slug = ?, label = ?, detail = ? where id = ?",
        tag.slug, tag.label, tag.detail, tag.id
    }
    .execute(&state.sql)
    .await?;

    Ok(Json(tag))
}

#[utoipa::path(
    delete,
    params(("pid" = i64, Path, example = 1), ("btid" = i64, Path, example = 1)),
    responses((status = 200))
)]
/// Delete
#[delete("/{btid}/")]
async fn tag_delete(
    tag: BlogTag, state: Data<AppState>,
) -> Result<HttpResponse, AppErr> {
    sqlx::query! {
        "delete from blog_tags where id = ?",
        tag.id,
    }
    .execute(&state.sql)
    .await?;

    sqlx::query! {
        "update projects set blog_tag_count = blog_tag_count - 1
        where id = ?", tag.project
    }
    .execute(&state.sql)
    .await?;

    Ok(HttpResponse::Ok().finish())
}

pub fn router() -> Scope {
    Scope::new("/{pid}/blog-tags")
        .service(tag_add)
        .service(tag_list)
        .service(tag_get)
        .service(tag_update)
        .service(tag_delete)
}
