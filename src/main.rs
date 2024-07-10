use actix_files as af;
use actix_multipart::form::tempfile::TempFileConfig;
use actix_multipart::form::MultipartFormConfig;
use actix_web::{
    get,
    http::header::ContentType,
    middleware,
    web::{scope, Data, ServiceConfig},
    App, HttpResponse, HttpServer, Responder,
};
use config::Config;
use models::AppErrBadRequest;
use sqlx::{Pool, Sqlite, SqlitePool};
use utoipa::OpenApi;

mod api;
mod config;
mod docs;
// mod general;
mod models;
mod utils;
mod web;

pub struct AppState {
    pub sql: Pool<Sqlite>,
}

#[get("/openapi.json")]
async fn openapi() -> impl Responder {
    let mut doc = docs::ApiDoc::openapi();
    doc.merge(api::user::ApiDoc::openapi());
    doc.merge(api::verification::ApiDoc::openapi());
    doc.merge(api::projects::ApiDoc::openapi());
    doc.merge(api::blog::blogs::ApiDoc::openapi());
    doc.merge(api::blog::blog_tag::ApiDoc::openapi());
    doc.merge(api::blog::categories::ApiDoc::openapi());
    doc.merge(api::blog::tags::ApiDoc::openapi());
    doc.merge(api::records::ApiDoc::openapi());

    // let mut admin_doc = ApiDoc::openapi();
    // admin_doc.merge(admin::user::Doc::openapi());
    // admin_doc.merge(admin::product::Doc::openapi());
    //
    // doc_add_prefix(&mut admin_doc, "/admin", false);
    //
    // doc.merge(admin_doc);

    docs::doc_add_prefix(&mut doc, "/api", false);

    HttpResponse::Ok().json(doc)
}

#[get("/rapidoc")]
async fn rapidoc() -> impl Responder {
    HttpResponse::Ok().content_type(ContentType::html()).body(
        r###"<!doctype html>
    <html><head><meta charset="utf-8"><style>rapi-doc {
    --green: #00dc7d; --blue: #5199ff; --orange: #ff6b00;
    --red: #ec0f0f; --yellow: #ffd600; --purple: #782fef; }</style>
    <script type="module" src="/static/rapidoc.js"></script></head><body>
    <rapi-doc spec-url="/openapi.json" persist-auth="true"
    bg-color="#040404" text-color="#f2f2f2"
    header-color="#040404" primary-color="#ec0f0f"
    nav-text-color="#eee" font-size="largest"
    allow-spec-url-load="false" allow-spec-file-load="false"
    show-method-in-nav-bar="as-colored-block" response-area-height="500px"
    show-header="false" schema-expand-level="1" /></body> </html>"###,
    )
}

fn config_app(app: &mut ServiceConfig) {
    if cfg!(debug_assertions) {
        app.service(
            af::Files::new("/static", "./static").disable_content_disposition(),
        );
        app.service(
            af::Files::new("/simurgh-record", Config::RECORD_DIR)
                .disable_content_disposition(),
        );
    }

    app.app_data(TempFileConfig::default().error_handler(|e, _| {
        actix_web::Error::from(AppErrBadRequest(Some(&e.to_string())))
    }));
    app.app_data(
        MultipartFormConfig::default().total_limit(209_715_200).error_handler(
            |e, _| {
                actix_web::Error::from(AppErrBadRequest(Some(&e.to_string())))
            },
        ),
    );

    app.service(openapi).service(rapidoc);
    app.service(
        scope("/api")
            .service(api::user::router())
            .service(api::projects::router())
            .service(api::verification::verification),
    );

    app.service(web::router());
}

#[cfg(unix)]
#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenvy::from_path(".env").expect("could not read .env file");
    pretty_env_logger::init();

    let _ = std::fs::create_dir(Config::RECORD_DIR);
    let pool = SqlitePool::connect("sqlite://main.db").await.unwrap();

    let server = HttpServer::new(move || {
        App::new()
            .wrap(middleware::Logger::new("%s %r %Ts"))
            .app_data(Data::new(AppState { sql: pool.clone() }))
            .configure(config_app)
    });

    let server = if cfg!(debug_assertions) {
        server.bind(("127.0.0.1", 7700)).unwrap()
    } else {
        use std::os::unix::fs::PermissionsExt;
        const PATH: &str = "/usr/share/nginx/sockets/simurgh.sock";
        let server = server.bind_uds(PATH).unwrap();
        std::fs::set_permissions(PATH, std::fs::Permissions::from_mode(0o777))?;
        server
    };

    server.run().await
}

#[cfg(windows)]
#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenvy::from_path(".env").expect("could not read .env file");
    pretty_env_logger::init();

    let _ = std::fs::create_dir(Config::RECORD_DIR);
    let pool = SqlitePool::connect("sqlite://main.db").await.unwrap();

    HttpServer::new(move || {
        App::new()
            .wrap(middleware::Logger::new("%s %r %Ts"))
            .app_data(Data::new(AppState { sql: pool.clone() }))
            .configure(config_app)
    })
    .bind(("127.0.0.1", 7700))
    .expect("server bind")
    .run()
    .await
}
