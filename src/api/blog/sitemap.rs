use crate::docs::UpdatePaths;
use crate::models::project::Project;
use crate::AppState;
use actix_web::http::header::ContentType;
use actix_web::web::{Data, Query};
use actix_web::{get, HttpResponse, Scope};
use cercis::prelude::*;
use chrono::TimeZone;
use serde::Deserialize;
use utoipa::{IntoParams, OpenApi};

#[derive(OpenApi)]
#[openapi(
    tags((name = "api::blogs-sitemap")),
    paths(sitemap),
    components(schemas()),
    servers((url = "/projects/{pid}/blogs-sitemap")),
    modifiers(&UpdatePaths)
)]
pub struct ApiDoc;

#[derive(Deserialize, IntoParams)]
struct SitemapQuery {
    base_url: String,
}

#[utoipa::path(
    get,
    params(("pid" = i64, Path, example = 1), SitemapQuery),
    responses((status = 200, body = String, content_type = "text/xml"))
)]
#[get("/")]
async fn sitemap(
    project: Project, q: Query<SitemapQuery>, state: Data<AppState>,
) -> HttpResponse {
    let blogs = sqlx::query! {
        "select slug, created_at, updated_at from blogs where project = ?",
        project.id
    }
    .fetch_all(&state.sql)
    .await
    .unwrap_or_default();

    // TODO: the max size of a sitemap is 50MG.
    // in this function generate the sitemap and the split it into 
    // 50MG chunks and put it into files under /record/sitemap/{pid}/...
    // and return the download url of the sitemap + hash

    let blogs = blogs.iter().map(|r| {
        let ts = if r.updated_at == 0 { r.created_at } else { r.updated_at };
        let dt = chrono::Local
            .timestamp_opt(ts, 0)
            .latest()
            .and_then(|v| Some(v.to_rfc3339()));
        (r.slug.clone(), dt)
    });

    let result = rsx! {
        urlset {
            xmlns: "http://www.sitemaps.org/schemas/sitemap/0.9",
            for (slug, ts) in blogs {
                url {
                    loc {"{q.base_url}/{slug}/"}
                    if let Some(ts) = ts { lastmod { "{ts}" } }
                }
            }
        }
    }
    .render();

    HttpResponse::Ok()
        .content_type(ContentType::xml())
        .body(r#"<?xml version="1.0" encoding="UTF-8"?>"#.to_string() + &result)
}

pub fn router() -> Scope {
    Scope::new("{pid}/blogs-sitemap").service(sitemap)
}
