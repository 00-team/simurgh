use actix_web::web::{Data, Json, Query};
use actix_web::{HttpResponse, Scope, delete, get, patch, post, put};
use nest::utils::random_string;
use serde::Deserialize;
use utoipa::{OpenApi, ToSchema};

use crate::config::Config;
use crate::docs::UpdatePaths;
use crate::models::blog::{Blog, BlogData, BlogStatus};
use crate::models::project::Project;
use crate::models::user::User;
use crate::models::{AppErr, JsonStr, ListInput, Response};
use crate::state::SimurghDb;
use crate::utils::CutOff;
use crate::{dar, utils};

#[derive(OpenApi)]
#[openapi(
    tags((name = "api::blogs")),
    paths(
        blog_list, blog_add, blog_get, blog_delete, blog_update,
        blog_update_data
    ),
    // components(schemas(
    //     Blog, BlogData, BlogStatus, BlogStyle, BlogUpdateBody,
    //     BlogTextGroup, BlogDirection, BlogAlign, BlogThumbnailUpload,
    //     BlogListItem, BlogCheckListItem
    // )),
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
    project: Project, q: Query<ListInput>, db: Data<SimurghDb>,
) -> Response<Vec<Blog>> {
    let offset = q.page * 32;
    let result = sqlx::query_as! {
        Blog,
        "select * from blogs where project = ? order by id desc limit 32 offset ?",
        project.id, offset
    }
    .fetch_all(&db.sql)
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
    user: User, project: Project, db: Data<SimurghDb>,
) -> Response<Blog> {
    let now = nest::sys_now() as i64;
    let mut tries = 0;
    let (id, slug) = loop {
        let slug = format!(
            "{}-{}",
            project.blog_count,
            random_string(Config::SLUG_ABC, 16)
        );
        let result = sqlx::query! {
            "insert into blogs(slug, project, author, created_at) values(?,?,?,?)",
            slug, project.id, user.id, now
        }
        .execute(&db.sql)
        .await;

        if let Ok(result) = result {
            break (result.last_insert_rowid(), slug);
        }

        tries += 1;
        if tries > 30 {
            return nest::err!(ServerError);
        }
    };

    let blog_count = project.blog_count + 1;
    sqlx::query! {
        "update projects set blog_count = ? where id = ?",
        blog_count, project.id
    }
    .execute(&db.sql)
    .await?;

    Ok(Json(Blog {
        id,
        slug,
        project: project.id,
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

#[derive(Deserialize, ToSchema)]
struct BlogUpdateBody {
    slug: String,
    status: BlogStatus,
    publish_at: Option<i64>,
    title: String,
    detail: String,
    read_time: i64,
    category: Option<i64>,
    thumbnail: Option<i64>,
}

#[utoipa::path(
    patch,
    params(("pid" = i64, Path, example = 1), ("bid" = i64, Path, example = 1)),
    request_body = BlogUpdateBody,
    responses((status = 200, body = Blog))
)]
/// Update
#[patch("/{bid}/")]
async fn blog_update(
    mut blog: Blog, mut body: Json<BlogUpdateBody>, db: Data<SimurghDb>,
) -> Response<Blog> {
    // let mut blog = blog;

    utils::verify_slug(&body.slug)?;

    if let Some(rid) = body.thumbnail {
        if body.thumbnail != blog.thumbnail {
            let record = dar::record_get(&db.sql, rid).await?;
            blog.thumbnail_url = Some(record.as_path().as_url());
        }
    } else {
        blog.thumbnail_url = None;
    }

    // let old_category = blog.category;
    // let new_category = body.category;

    // blog.slug = body.slug.clone();
    // blog.slug.cut_off(255);
    // blog.status = body.status.clone();
    // blog.updated_at = nest::sys_now() as i64;
    // blog.title = body.title.clone();
    body.title.cut_off(255);
    // blog.detail = body.detail.clone();
    body.detail.cut_off(2047);
    // blog.read_time = body.read_time;
    // blog.category = body.category;
    // blog.publish_at = body.publish_at;

    let now = nest::sys_now() as i64;

    let blog = sqlx::query_as! {
        Blog,
        "update blogs set
            slug = ?, status = ?, updated_at = ?, title = ?, detail = ?,
            read_time = ?, category = ?, publish_at = ?,
            thumbnail = ?, thumbnail_url = ?
            where id = ? returning *
        ",
        body.slug, body.status, now, body.title, body.detail,
        body.read_time, body.category, body.publish_at,
        body.thumbnail, blog.thumbnail_url,
        blog.id
    }
    .fetch_one(&db.sql)
    .await?;

    // if old_category == new_category {
    //     return Ok(Json(blog));
    // }
    //
    // if let Some(cid) = new_category {
    //     sqlx::query! { "update blog_categories set count = count + 1 where id = ?", cid }
    //     .execute(&db.sql)
    //     .await?;
    // }
    //
    // if let Some(cid) = old_category {
    //     sqlx::query! { "update blog_categories set count = count - 1 where id = ?", cid }
    //     .execute(&db.sql)
    //     .await?;
    // }

    Ok(Json(blog))
}

#[utoipa::path(
    put,
    params(("pid" = i64, Path, example = 1), ("bid" = i64, Path, example = 1)),
    request_body = Vec<BlogData>,
    responses((status = 200, body = Blog))
)]
/// Update Data
#[put("/{bid}/data/")]
async fn blog_update_data(
    blog: Blog, Json(data): Json<Vec<BlogData>>, db: Data<SimurghDb>,
) -> Response<Blog> {
    let mut blog = blog;
    let mut data = data;

    for bd in data.iter_mut() {
        if let BlogData::Heading { level, .. } = bd {
            *level = (*level).clamp(1, 6);
        }
    }

    // data.iter_mut().for_each(|b| match b {
    //     BlogData::Heading { level, .. } => {
    //         *level = (*level).clamp(1, 6);
    //     }
    //     _ => (),
    // });

    blog.updated_at = nest::sys_now() as i64;
    blog.html = super::render::blog_render(&data);
    blog.data = JsonStr(data);

    sqlx::query! {
        "update blogs set updated_at = ?, html = ?, data = ? where id = ?",
        blog.updated_at, blog.html, blog.data, blog.id
    }
    .execute(&db.sql)
    .await?;

    Ok(Json(blog))
}

// #[derive(Debug, MultipartForm, ToSchema)]
// pub struct BlogThumbnailUpload {
//     #[schema(value_type = String, format = Binary)]
//     #[multipart(limit = "8MB")]
//     pub photo: TempFile,
// }
//
// #[utoipa::path(
//     put,
//     params(("pid" = i64, Path, example = 1), ("bid" = i64, Path, example = 1)),
//     request_body(content = BlogThumbnailUpload, content_type = "multipart/form-data"),
//     responses((status = 200, body = Blog))
// )]
// /// Thumbnail Update
// #[put("/{bid}/thumbnail/")]
// async fn blog_thumbnail_update(
//     blog: Blog, form: MultipartForm<BlogThumbnailUpload>, db: Data<SimurghDb>,
// ) -> Response<Blog> {
//     let mut blog = blog;
//
//     let salt = if let Some(p) = &blog.thumbnail {
//         p.clone()
//     } else {
//         let s = random_salt();
//         blog.thumbnail = Some(s.clone());
//         s
//     };
//
//     utils::save_photo(
//         form.photo.file.path(),
//         &format!("bt-{}-{salt}", blog.id),
//         (1920, 1080),
//     )?;
//
//     sqlx::query! {
//         "update blogs set thumbnail = ? where id = ?",
//         blog.thumbnail, blog.id
//     }
//     .execute(&db.sql)
//     .await?;
//
//     Ok(Json(blog))
// }

// #[utoipa::path(
//     delete,
//     params(("pid" = i64, Path, example = 1), ("bid" = i64, Path, example = 1)),
//     responses((status = 200, body = Blog))
// )]
// /// Thumbnail Delete
// #[delete("/{bid}/thumbnail/")]
// async fn blog_thumbnail_delete(
//     blog: Blog, db: Data<SimurghDb>,
// ) -> Response<Blog> {
//     let mut blog = blog;
//
//     if blog.thumbnail.is_none() {
//         return Ok(Json(blog));
//     }
//
//     let salt = blog.thumbnail.clone().unwrap();
//     utils::remove_record(&format!("bt-{}-{salt}", blog.id));
//     blog.thumbnail = None;
//
//     sqlx::query! {
//         "update blogs set thumbnail = null where id = ?",
//         blog.id
//     }
//     .execute(&db.sql)
//     .await?;
//
//     Ok(Json(blog))
// }

#[utoipa::path(
    delete,
    params(("pid" = i64, Path, example = 1), ("bid" = i64, Path, example = 1)),
    responses((status = 200))
)]
/// Delete
#[delete("/{bid}/")]
async fn blog_delete(
    blog: Blog, db: Data<SimurghDb>,
) -> Result<HttpResponse, AppErr> {
    // let blogs = sqlx::query_as! {
    //     Blog,
    //     "select * from blogs where project = null"
    // }
    // .fetch_all(&db.sql)
    // .await?;

    // for b in blogs {
    //     if let Some(salt) = &b.thumbnail {
    //         utils::remove_record(&format!("bt-{}-{salt}", blog.id));
    //     }
    // }

    // if let Some(salt) = &blog.thumbnail {
    //     utils::remove_record(&format!("bt-{}-{salt}", blog.id));
    // }

    sqlx::query! {
        "delete from blogs where id = ?",
        blog.id,
    }
    .execute(&db.sql)
    .await?;

    sqlx::query! {
        "update projects set blog_count = blog_count - 1 where id = ?",
        blog.project
    }
    .execute(&db.sql)
    .await?;

    Ok(HttpResponse::Ok().finish())
}

pub fn router() -> Scope {
    Scope::new("/{pid}/blogs")
        .service(blog_add)
        .service(blog_list)
        .service(blog_get)
        .service(blog_update)
        .service(blog_update_data)
        .service(blog_delete)
        // .service(blog_thumbnail_update)
        // .service(blog_thumbnail_delete)
        .service(super::blog_tag::router())
}
