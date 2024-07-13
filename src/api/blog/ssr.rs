use actix_web::web::{Data, Query, Path};
use actix_web::{get, Scope};
use cercis::html::VContent;
use cercis::prelude::*;
use utoipa::OpenApi;

use crate::docs::UpdatePaths;
use crate::models::blog::{Blog, BlogStatus};
use crate::models::project::Project;
use crate::models::{AppErr, AppErrNotFound, Html, ListInput};
use crate::AppState;

#[derive(OpenApi)]
#[openapi(
    tags((name = "api::blogs-ssr")),
    paths(ssr_list, ssr_get),
    components(schemas()),
    servers((url = "/projects/{pid}/blogs-ssr")),
    modifiers(&UpdatePaths)
)]
pub struct ApiDoc;

type Response = Result<Html, AppErr>;

#[utoipa::path(
    get,
    params(("pid" = i64, Path, example = 1), ListInput),
    responses((status = 200, body = String, content_type = "text/html"))
)]
/// List
#[get("/")]
async fn ssr_list(
    project: Project, q: Query<ListInput>, state: Data<AppState>,
) -> Response {
    let offset = q.page * 32;
    let blogs = sqlx::query_as! {
        Blog,
        "select * from blogs where project = ? and status = ?
        order by id desc limit 32 offset ?",
        project.id, BlogStatus::Published, offset
    }
    .fetch_all(&state.sql)
    .await?;

    let result = rsx! {
        section {
            class: "simurgh--blogs",

            for blog in blogs {
                figure {
                    if let Some(t) = blog.thumbnail {
                        img {
                            decode: "async",
                            loading: "lazy",
                            src: "/simurgh-record/bt-{blog.id}-{t}"
                        }
                    }

                    h2 {"{blog.title}"}
                    span { "read time: {blog.read_time}" }
                    span {
                        "date creation: {blog.created_at}"
                        svg {
                            width: 24,
                            height: 24,
                            image {
                                "xlink:href": "/simurgh-ssrs/icon/calendar-days.svg",
                                width: 24,
                                height: 24,
                            }
                        }
                    }
                    figcaption {"{blog.detail}"}
                    a { href: "/blogs/{blog.id}/", "دیدن بیشتر" }
                }
            }
        }
    }
    .render();

    Ok(Html(result))
}

#[utoipa::path(
    get,
    params(("pid" = i64, Path, example = 1), ("slug" = String, Path,)),
    responses((status = 200, body = String, content_type = "text/html"))
)]
/// Get
#[get("/{slug}/")]
async fn ssr_get(
    project: Project, path: Path<(String,)>, state: Data<AppState>,
) -> Response {
    let blog = sqlx::query_as! {
        Blog,
        "select * from blogs where project = ? AND slug = ?",
        project.id, path.0
    }
    .fetch_one(&state.sql)
    .await?;

    if blog.status != BlogStatus::Published {
        return Err(AppErrNotFound(None));
    }

    let preview = VContent::new(&blog.html).raw(true);

    let result = rsx! {
        div {
            class: "simurgh--blog-fnd",

            div {
                class: "simurgh--blog-preview",
                preview
            }
        }
    }
    .render();

    Ok(Html(result))
}

pub fn router() -> Scope {
    Scope::new("/{pid}/blogs-ssr").service(ssr_list).service(ssr_get)
}
