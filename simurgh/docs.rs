use crate::AppErr;
use crate::Config;
use crate::{admin, api};
use actix_web::{
    HttpResponse, Responder, get,
    http::header::{CACHE_CONTROL, ContentType},
};
use std::collections::BTreeMap;
use utoipa::OpenApi;
use utoipa::{
    Modify,
    openapi::{
        self as oa, Components, Content, RefOr, Response, SecurityRequirement,
        security::{ApiKey, ApiKeyValue, SecurityScheme},
    },
};

#[derive(utoipa::OpenApi)]
#[openapi(
    info(version = Config::API_VERSION),
    servers((url = "/")),
    modifiers(&AddSecurity),
    components(schemas(AppErr))
)]
pub struct ApiDoc;

#[get("/openapi.json")]
pub async fn openapi_json() -> impl Responder {
    let mut doc = ApiDoc::openapi();

    let mut admin_doc = ApiDoc::openapi();

    admin_doc.merge(admin::projects::ApiDoc::openapi());
    doc_add_prefix(&mut admin_doc, "/admin", false);
    doc.merge(admin_doc);

    doc.merge(api::user::ApiDoc::openapi());
    doc.merge(api::verification::ApiDoc::openapi());
    doc.merge(api::projects::ApiDoc::openapi());
    doc.merge(api::blog::blogs::ApiDoc::openapi());
    doc.merge(api::blog::blog_tag::ApiDoc::openapi());
    doc.merge(api::blog::categories::ApiDoc::openapi());
    doc.merge(api::blog::sitemap::ApiDoc::openapi());
    doc.merge(api::blog::ssr::ApiDoc::openapi());
    doc.merge(api::blog::tags::ApiDoc::openapi());
    doc.merge(api::records::ApiDoc::openapi());

    doc_add_prefix(&mut doc, "/api", false);

    HttpResponse::Ok().insert_header((CACHE_CONTROL, "no-cache")).json(doc)
}

#[get("/rapidoc")]
pub async fn rapidoc() -> impl Responder {
    HttpResponse::Ok().content_type(ContentType::html()).body(
        r###"<!doctype html>
    <html><head><style>html {background: #040404}</style>
    <meta charset="utf-8"><style>rapi-doc {
    --green: #00dc7d; --blue: #5199ff; --orange: #ff6b00;
    --red: #ec0f0f; --yellow: #ffd600; --purple: #782fef; }</style>
    <script type="module" src="/static/rapidoc.js"></script></head><body>
    <rapi-doc spec-url="/openapi.json" persist-auth="true"
    bg-color="#040404" text-color="#f2f2f2"
    header-color="#040404" primary-color="#ec0f0f"
    nav-text-color="#eee" font-size="largest"
    allow-spec-url-load="false" allow-spec-file-load="false"
    show-method-in-nav-bar="as-colored-block" response-area-height="500px"
    show-header="false" schema-expand-level="1"
    x-tag-expanded="false"
    /></body> </html>"###,
    )
}

pub struct AddSecurity;

impl Modify for AddSecurity {
    fn modify(&self, openapi: &mut oa::OpenApi) {
        if openapi.components.is_none() {
            openapi.components = Some(Components::new());
        }

        if let Some(schema) = openapi.components.as_mut() {
            macro_rules! ss {
                ($name:literal) => {
                    schema.add_security_scheme(
                        concat!("ah_", $name),
                        SecurityScheme::ApiKey(ApiKey::Header(
                            ApiKeyValue::new(concat!("x-dokon-auth-", $name)),
                        )),
                    );
                    schema.add_security_scheme(
                        concat!("ac_", $name),
                        SecurityScheme::ApiKey(ApiKey::Cookie(
                            ApiKeyValue::new(concat!("x-dokon-auth-", $name)),
                        )),
                    );
                };
            }

            ss!("user");
            // ss!("golem");
            // ss!("ssr");
        }

        openapi.security = Some(vec![
            SecurityRequirement::new("ah_user", [""; 0]),
            SecurityRequirement::new("ah_staff", [""; 0]),
        ]);
    }
}

fn doc_add_prefix(openapi: &mut oa::OpenApi, prefix: &str, update_tags: bool) {
    let mut paths = BTreeMap::new();
    let tags: Vec<String> = openapi
        .tags
        .clone()
        .unwrap_or_default()
        .iter()
        .map(|t| t.name.clone())
        .collect();

    for (url, item) in openapi.paths.paths.iter() {
        let new_url = prefix.to_string() + url;
        let mut item = item.clone();
        let eref = oa::RefOr::Ref(oa::Ref::new("#/components/schemas/AppErr"));
        let content = Content::builder().schema(Some(eref)).build();
        let xxx = oa::RefOr::T(
            Response::builder()
                .description("errors")
                .content("application/json", content)
                .build(),
        );

        macro_rules! op {
            ($($op:ident),*) => {
                $(if let Some(op) = &mut item.$op {
                    op.responses.responses.insert("xxx".to_string(), xxx.clone());
                    if update_tags {
                        op.tags = Some(tags.clone());
                    }
                })*
            };
        }

        op!(get, put, post, delete, options, head, patch, trace);

        paths.insert(new_url, item);
    }
    openapi.paths.paths = paths;
}

pub struct UpdatePaths;

impl Modify for UpdatePaths {
    fn modify(&self, openapi: &mut oa::OpenApi) {
        if let Some(comps) = &mut openapi.components {
            for (k, v) in comps.schemas.iter_mut() {
                if let RefOr::T(oa::Schema::Object(obj)) = v
                    && obj.title.is_none()
                {
                    obj.title = Some(k.clone());
                }
            }
        }

        let base_path = if let Some(s) = openapi.servers.as_mut() {
            if !s.is_empty() { s.remove(0).url } else { String::new() }
        } else {
            String::new()
        };

        doc_add_prefix(openapi, &base_path, true);
    }
}
