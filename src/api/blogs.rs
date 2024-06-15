use actix_web::web::{Data, Json, Query};
use actix_web::{get, post, Scope};
use utoipa::OpenApi;

use crate::config::Config;
use crate::docs::UpdatePaths;
use crate::models::blog::Blog;
use crate::models::project::Project;
use crate::models::user::User;
use crate::models::{AppErr, ListInput, Response};
use crate::{utils, AppState};

#[derive(OpenApi)]
#[openapi(
    tags((name = "api::blogs")),
    paths(
        blog_list, blog_add, blog_get
    ),
    components(schemas(Blog)),
    servers((url = "/projects/{pid}/blogs")),
    modifiers(&UpdatePaths)
)]
pub struct ApiDoc;

#[utoipa::path(
    get,
    params(("pid" = i64, Path, example = 1), ListInput),
    responses((status = 200, body = Vec<Blog>))
)]
/// List
#[get("/")]
async fn blog_list(
    project: Project, q: Query<ListInput>, state: Data<AppState>,
) -> Response<Vec<Blog>> {
    let offset = q.page * 32;
    let result = sqlx::query_as! {
        Blog,
        "select * from blogs where project = ? order by id desc limit 32 offset ?",
        project.id, offset
    }
    .fetch_all(&state.sql)
    .await?;

    Ok(Json(result))
}

#[utoipa::path(
    post,
    params(("pid" = i64, Path, example = 1)),
    responses((status = 200, body = Blog))
)]
/// Add
#[post("/")]
async fn blog_add(
    user: User, project: Project, state: Data<AppState>,
) -> Response<Blog> {
    let now = utils::now();
    let mut tries = 0;
    let slug = loop {
        let slug = format!(
            "{}-{}",
            project.blog_count,
            utils::get_random_string(Config::SLUG_ABC, 16)
        );
        let result = sqlx::query! {
            "insert into blogs(slug, project, author, created_at) values(?,?,?,?)",
            slug, project.id, user.id, now
        }
        .execute(&state.sql)
        .await;

        if result.is_ok() {
            break slug;
        }

        tries += 1;
        if tries > 3 {
            return Err(AppErr::default());
        }
    };

    Ok(Json(Blog {
        slug,
        project: project.id,
        author: user.id,
        created_at: now,
        ..Default::default()
    }))
}

#[utoipa::path(
    get,
    params(
        ("pid" = i64, Path, example = 1),
        ("bid" = i64, Path, example = 1),
    ),
    responses((status = 200, body = Blog))
)]
/// Get
#[get("/{bid}/")]
async fn blog_get(blog: Blog) -> Response<Blog> {
    Ok(Json(blog))
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
    Scope::new("/{pid}/blogs")
        .service(blog_add)
        .service(blog_list)
        .service(blog_get)
        .service(super::blog_contents::router())
}
