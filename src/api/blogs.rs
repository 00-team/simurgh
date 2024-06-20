use actix_multipart::form::tempfile::TempFile;
use actix_multipart::form::MultipartForm;
use actix_web::web::{Data, Json, Query};
use actix_web::{delete, get, post, put, HttpResponse, Scope};
use utoipa::{OpenApi, ToSchema};

use crate::config::Config;
use crate::docs::UpdatePaths;
use crate::models::blog::{
    Blog, BlogData, BlogStatus, BlogStyle, BlogTextDirection, BlogTextGroup,
};
use crate::models::project::Project;
use crate::models::user::User;
use crate::models::{AppErr, ListInput, Response};
use crate::{utils, AppState};

#[derive(OpenApi)]
#[openapi(
    tags((name = "api::blogs")),
    paths(
        blog_list, blog_add, blog_get, blog_delete,
        blog_thumbnail_update, blog_thumbnail_delete
    ),
    components(schemas(
        Blog, BlogData, BlogStatus, BlogStyle,
        BlogTextGroup, BlogTextDirection, BlogThumbnailUpload,
    )),
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
    let (id, slug) = loop {
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

        if let Ok(result) = result {
            break (result.last_insert_rowid(), slug);
        }

        tries += 1;
        if tries > 3 {
            return Err(AppErr::default());
        }
    };

    let blog_count = project.blog_count + 1;
    sqlx::query! {
        "update projects set blog_count = ? where id = ?",
        blog_count, project.id
    }
    .execute(&state.sql)
    .await?;

    Ok(Json(Blog {
        id,
        slug,
        project: Some(project.id),
        author: Some(user.id),
        created_at: now,
        ..Default::default()
    }))
}

#[utoipa::path(
    get,
    params(("pid" = i64, Path, example = 1), ("bid" = i64, Path, example = 1)),
    responses((status = 200, body = Blog))
)]
/// Get
#[get("/{bid}/")]
async fn blog_get(blog: Blog) -> Response<Blog> {
    Ok(Json(blog))
}

#[derive(Debug, MultipartForm, ToSchema)]
pub struct BlogThumbnailUpload {
    #[schema(value_type = String, format = Binary)]
    #[multipart(limit = "8MB")]
    pub photo: TempFile,
}

#[utoipa::path(
    put,
    params(("pid" = i64, Path, example = 1), ("bid" = i64, Path, example = 1)),
    request_body(content = RecordUpload, content_type = "multipart/form-data"),
    responses((status = 200, body = Blog))
)]
/// Thumbnail Update
#[put("/{bid}/thumbnail/")]
async fn blog_thumbnail_update(
    blog: Blog, form: MultipartForm<BlogThumbnailUpload>, state: Data<AppState>,
) -> Response<Blog> {
    let mut blog = blog;

    let salt = if let Some(p) = &blog.thumbnail {
        p.clone()
    } else {
        let s = utils::get_random_bytes(8);
        blog.thumbnail = Some(s.clone());
        s
    };

    utils::save_photo(
        form.photo.file.path(),
        &format!("bt-{}-{salt}", blog.id),
        (1920, 1080),
    )?;

    sqlx::query! {
        "update blogs set thumbnail = ? where id = ?",
        blog.thumbnail, blog.id
    }
    .execute(&state.sql)
    .await?;

    Ok(Json(blog))
}

#[utoipa::path(
    delete,
    params(("pid" = i64, Path, example = 1), ("bid" = i64, Path, example = 1)),
    responses((status = 200, body = Blog))
)]
/// Thumbnail Delete
#[delete("/{bid}/thumbnail/")]
async fn blog_thumbnail_delete(
    blog: Blog, state: Data<AppState>,
) -> Response<Blog> {
    if blog.thumbnail.is_none() {
        return Ok(Json(blog));
    }

    let salt = blog.thumbnail.clone().unwrap();
    utils::remove_record(&format!("bt-{}-{salt}", blog.id));

    sqlx::query! {
        "update blogs set thumbnail = null where id = ?",
        blog.id
    }
    .execute(&state.sql)
    .await?;

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

#[utoipa::path(
    delete,
    params(("pid" = i64, Path, example = 1), ("bid" = i64, Path, example = 1)),
    responses((status = 200))
)]
/// Delete
#[delete("/{id}/")]
async fn blog_delete(
    blog: Blog, state: Data<AppState>,
) -> Result<HttpResponse, AppErr> {
    let blogs = sqlx::query_as! {
        Blog,
        "select * from blogs where project = null"
    }
    .fetch_all(&state.sql)
    .await?;

    for b in blogs {
        if let Some(salt) = &b.thumbnail {
            utils::remove_record(&format!("bt-{}-{salt}", blog.id));
        }
    }

    if let Some(salt) = &blog.thumbnail {
        utils::remove_record(&format!("bt-{}-{salt}", blog.id));
    }

    sqlx::query! {
        "delete from blogs where id = ?",
        blog.id,
    }
    .execute(&state.sql)
    .await?;

    if let Some(pid) = blog.project {
        sqlx::query! {
            "update projects set blog_count = blog_count - 1 where id = ?",
            pid
        }
        .execute(&state.sql)
        .await?;
    }

    Ok(HttpResponse::Ok().finish())
}

pub fn router() -> Scope {
    Scope::new("/{pid}/blogs")
        .service(blog_add)
        .service(blog_list)
        .service(blog_get)
        .service(blog_delete)
        .service(blog_thumbnail_update)
        .service(blog_thumbnail_delete)
}
