use actix_web::web::{Data, Json, Path, Query};
use actix_web::{get, Scope};
use cercis::html::VContent;
use cercis::prelude::*;
use chrono::TimeZone;
use serde::Serialize;
use utoipa::{OpenApi, ToSchema};

use crate::docs::UpdatePaths;
use crate::models::blog::{Blog, BlogStatus};
use crate::models::project::Project;
use crate::models::{AppErr, Html, ListInput};
use crate::AppState;

#[derive(OpenApi)]
#[openapi(
    tags((name = "api::blogs-ssr")),
    paths(ssr_list, ssr_get),
    components(schemas(BlogSSRR)),
    servers((url = "/projects/{pid}/blogs-ssr")),
    modifiers(&UpdatePaths)
)]
pub struct ApiDoc;

type Response = Result<Html, AppErr>;

macro_rules! icon {
    ($name:ident, $path:literal) => {
        #[component]
        fn $name() -> Element {
            let svg = VContent::new(std::include_str!(std::concat!(
                "icons/", $path, ".svg"
            )))
            .raw(true);
            rsx!(svg)
        }
    };
}

icon!(ReadtimeIcon, "reading-time");
icon!(CalendarDaysIcon, "calendar");
icon!(CalendarUpdateIcon, "calendar-update");

#[component]
fn ReadTime(value: i64) -> Element {
    let rt = *value;
    let hours = rt / 3600;
    let rt = rt % 3600;
    let minutes = rt / 60;
    let seconds = rt % 60;

    let values = vec![(hours, "ساعت"), (minutes, "دقیقه"), (seconds, "ثانیه")]
        .iter()
        .filter(|(a, _)| *a > 0)
        .map(|(a, b)| format!("{a} {b}"))
        .collect::<Vec<_>>()
        .join(" و ");

    rsx! { "{values}" }
}

#[component]
fn DateTime(value: i64) -> Element {
    let dt = chrono::Local
        .timestamp_opt(*value, 0)
        .latest()
        .map(|v| v.format("%F").to_string())
        .unwrap_or("---".to_string());

    rsx! { "{dt}" }
}

#[component]
fn Multiline(value: String) -> Element {
    let value = value.split('\n').collect::<Vec<_>>();
    let it = value.iter().enumerate().map(|(i, v)| {
        let line = v.to_string();
        rsx! {
            line
            if i != value.len() -1 {
                br {}
            }
        }
    });

    rsx! { for item in it { item } }
}

#[component]
fn BlogCard(blog: Blog) -> Element {
    rsx! {
        article {
            if let Some(t) = &blog.thumbnail {
                img {
                    decode: "async",
                    loading: "lazy",
                    src: "/simurgh-record/bt-{blog.id}-{t}",
                    alt: "{blog.title}"
                }
            }

            h2 { "{blog.title}" }

            div {
                span {
                    class:"detail-container",
                    ReadtimeIcon {}
                    span { ReadTime { value: blog.read_time } }
                }
                span {
                    class:"detail-container",
                    span { DateTime { value: blog.created_at } }
                    CalendarDaysIcon {}
                }
            }

            p { Multiline { value: blog.detail.clone() } }
            a { href: "/blogs/{blog.slug}/", "دیدن بیشتر" }
        }
    }
}

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
            for blog in blogs { BlogCard { blog: blog } }
        }
    }
    .render();

    Ok(Html(result))
}

async fn get_related<'a>(
    blog: &'a Blog, state: &'a AppState,
) -> Result<Element<'a>, AppErr> {
    let next = sqlx::query_as! {
        Blog,
        "select * from blogs where id > ? and status = ? order by id asc limit 1",
        blog.id, BlogStatus::Published
    }
    .fetch_optional(&state.sql)
    .await?;

    let past = sqlx::query_as! {
        Blog,
        "select * from blogs where id < ? and status = ? order by id desc limit 1",
        blog.id, BlogStatus::Published
    }
    .fetch_optional(&state.sql)
    .await?;

    let related = sqlx::query_as! {
        Blog,
        "select * from blogs where id in (
            select blog from blog_tag where tag in (
                select tag from blog_tag where blog = ?
            )
        ) and status = ? limit 3",
        blog.id, BlogStatus::Published
    }
    .fetch_all(&state.sql)
    .await?;

    Ok(rsx! {
        section {
            class: "related-blogs",
            h3 { "مقاله های مشابه" }
            div {
                class: "related-wrapper",
                if let Some(blog) = past {
                    BlogCard { blog: blog }
                }

                for blog in related { BlogCard { blog: blog } }

                if let Some(blog) = next {
                    BlogCard { blog: blog }
                }
            }
        }
    })
}

#[derive(Serialize, ToSchema)]
struct BlogSSRR {
    blog: Blog,
    html: String,
}

#[utoipa::path(
    get,
    params(("pid" = i64, Path, example = 1), ("slug" = String, Path,)),
    responses((status = 200, body = BlogSSRR))
)]
/// Get
#[get("/{slug}/")]
async fn ssr_get(
    project: Project, path: Path<(i64, String)>, state: Data<AppState>,
) -> Result<Json<BlogSSRR>, AppErr> {
    let blog = sqlx::query_as! {
        Blog,
        "select * from blogs where project = ? AND slug = ? AND status = ?",
        project.id, path.1, BlogStatus::Published
    }
    .fetch_one(&state.sql)
    .await?;

    let preview = VContent::new(&blog.html).raw(true);
    let related = get_related(&blog, &state).await?;

    let html = rsx! {
        main {
            class: "simurgh--blog-fnd",

            if let Some(t) = &blog.thumbnail {
                img {
                    class: "simurgh--blog-thumbnail",
                    src: "/simurgh-record/bt-{blog.id}-{t}"
                }
            }

            section {
                class: "simurgh--blog-options",

                div {
                    class: "simurgh--blog-option",
                    div { ReadtimeIcon {} "زمان مطالعه:" }
                    span { ReadTime { value: blog.read_time } }
                }

                div {
                    class: "simurgh--blog-option",
                    div { CalendarDaysIcon {} "تاریخ ثبت:" }
                    span { DateTime { value: blog.created_at } }
                }

                div {
                    class: "simurgh--blog-option",
                    div { CalendarUpdateIcon {} "تاریخ به روز رسانی:" }
                    span { DateTime { value: blog.updated_at } }
                }
            }

            header { span { "{blog.title}" } }

            article {
                class: "simurgh--blog-preview",
                preview
            }

            related
        }
    }
    .render();

    Ok(Json(BlogSSRR { blog: blog.clone(), html }))
}

pub fn router() -> Scope {
    Scope::new("/{pid}/blogs-ssr").service(ssr_list).service(ssr_get)
}
