use actix_web::web::{Data, Json, Query};
use actix_web::{delete, get, patch, post, HttpResponse, Scope};
use serde::Deserialize;
use utoipa::{OpenApi, ToSchema};

use crate::config::Config;
use crate::docs::UpdatePaths;
use crate::models::blog::BlogCategory;
use crate::models::project::Project;
use crate::models::{AppErr, ListInput, Response};
use crate::utils::CutOff;
use crate::{utils, AppState};

#[derive(OpenApi)]
#[openapi(
    tags((name = "api::blog-categories")),
    paths(
        category_list, category_add, category_get,
        category_update, category_delete
    ),
    components(schemas(
        BlogCategory, BlogCategoryUpdateBody,
    )),
    servers((url = "/projects/{pid}/blog-categories")),
    modifiers(&UpdatePaths)
)]
pub struct ApiDoc;

#[utoipa::path(
    get,
    params(("pid" = i64, Path, example = 1), ListInput),
    responses((status = 200, body = Vec<BlogCategory>))
)]
/// List
#[get("/")]
async fn category_list(
    project: Project, q: Query<ListInput>, state: Data<AppState>,
) -> Response<Vec<BlogCategory>> {
    let offset = q.page * 32;
    let result = sqlx::query_as! {
        BlogCategory,
        "select * from blog_categories where project = ? order by id desc limit 32 offset ?",
        project.id, offset
    }
    .fetch_all(&state.sql)
    .await?;

    Ok(Json(result))
}

#[utoipa::path(
    post,
    params(("pid" = i64, Path, example = 1)),
    responses((status = 200, body = BlogCategory))
)]
/// Add
#[post("/")]
async fn category_add(
    project: Project, state: Data<AppState>,
) -> Response<BlogCategory> {
    let mut tries = 0;
    let (id, slug) = loop {
        let slug = format!(
            "{}-{}",
            project.blog_category_count,
            utils::get_random_string(Config::SLUG_ABC, 16)
        );
        let result = sqlx::query! {
            "insert into blog_categories(slug, project, label) values(?,?,'')",
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
        "update projects set blog_category_count = blog_category_count + 1
        where id = ?", project.id
    }
    .execute(&state.sql)
    .await?;

    Ok(Json(BlogCategory {
        id,
        slug,
        project: project.id,
        ..Default::default()
    }))
}

#[utoipa::path(
    get,
    params(("pid" = i64, Path, example = 1), ("bcid" = i64, Path, example = 1)),
    responses((status = 200, body = Blog))
)]
/// Get
#[get("/{bcid}/")]
async fn category_get(category: BlogCategory) -> Response<BlogCategory> {
    Ok(Json(category))
}

#[derive(Deserialize, ToSchema)]
struct BlogCategoryUpdateBody {
    slug: String,
    label: String,
    detail: String,
}

#[utoipa::path(
    patch,
    params(("pid" = i64, Path, example = 1), ("bcid" = i64, Path, example = 1)),
    request_body = BlogCategoryUpdateBody,
    responses((status = 200, body = Blog))
)]
/// Update
#[patch("/{bcid}/")]
async fn category_update(
    category: BlogCategory, body: Json<BlogCategoryUpdateBody>,
    state: Data<AppState>,
) -> Response<BlogCategory> {
    let mut category = category;

    utils::verify_slug(&body.slug)?;

    category.slug = body.slug.clone();
    category.slug.cut_off(255);
    category.label = body.label.clone();
    category.label.cut_off(255);
    category.detail = body.detail.clone();
    category.detail.cut_off(2047);

    sqlx::query! {
        "update blog_categories set slug = ?, label = ?, detail = ? where id = ?",
        category.slug, category.label, category.detail, category.id
    }
    .execute(&state.sql)
    .await?;

    Ok(Json(category))
}

#[utoipa::path(
    delete,
    params(("pid" = i64, Path, example = 1), ("bcid" = i64, Path, example = 1)),
    responses((status = 200))
)]
/// Delete
#[delete("/{bcid}/")]
async fn category_delete(
    category: BlogCategory, state: Data<AppState>,
) -> Result<HttpResponse, AppErr> {
    sqlx::query! {
        "delete from blog_categories where id = ?",
        category.id,
    }
    .execute(&state.sql)
    .await?;

    sqlx::query! {
        "update projects set blog_category_count = blog_category_count - 1
        where id = ?", category.project
    }
    .execute(&state.sql)
    .await?;

    Ok(HttpResponse::Ok().finish())
}

pub fn router() -> Scope {
    Scope::new("/{pid}/blog-categories")
        .service(category_add)
        .service(category_list)
        .service(category_get)
        .service(category_update)
        .service(category_delete)
}
