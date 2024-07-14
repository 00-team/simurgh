use actix_web::web::{Data, Path, Query};
use actix_web::{get, Scope};
use cercis::html::VContent;
use cercis::prelude::*;
use utoipa::OpenApi;

use crate::docs::UpdatePaths;
use crate::models::blog::{Blog, BlogStatus};
use crate::models::project::Project;
use crate::models::{AppErr, Html, ListInput};
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

macro_rules! icon {
    ($name:ident, $path:literal) => {
        #[component]
        fn $name() -> Element {
            let svg = VContent::new(
                std::include_str!(std::concat!("icons/", $path, ".svg"))
            ).raw(true);
            rsx!(svg)
        }
    };
}

icon!(ReadtimeIcon, "read-time");
icon!(CalendarDaysIcon, "calendar");

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

                    div {
                        span {
                            class:"detail-container",

                            ReadtimeIcon {}
                            span{
                                "{blog.read_time}" 
                            }
                        }
                        span {
                            class:"detail-container",

                            span{
                                "{blog.created_at}"
                            }
                            CalendarDaysIcon {}
                        }
                    }

                    figcaption {"{blog.detail}"}
                    a { href: "/blogs/{blog.slug}/", "دیدن بیشتر" }
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
    project: Project, path: Path<(i64, String)>, state: Data<AppState>,
) -> Response {
    let blog = sqlx::query_as! {
        Blog,
        "select * from blogs where project = ? AND slug = ? AND status = ?",
        project.id, path.1, BlogStatus::Published
    }
    .fetch_one(&state.sql)
    .await?;

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
