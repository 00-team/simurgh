use std::{fs::read_to_string, os::unix::fs::PermissionsExt};

use actix_files as af;
use actix_web::{
    get,
    http::header::ContentType,
    middleware,
    web::{self, scope, Data},
    App, HttpResponse, HttpServer, Responder,
};
use config::Config;
use sqlx::{Pool, Sqlite, SqlitePool};
use utoipa::OpenApi;

mod api;
mod config;
mod docs;
// mod general;
mod models;
mod utils;
// mod vendor;

pub struct AppState {
    pub sql: Pool<Sqlite>,
}

#[get("/")]
async fn index() -> impl Responder {
    let result = read_to_string("static/dist/index.html")
        .unwrap_or("err reading index.html".to_string());
    HttpResponse::Ok().content_type(ContentType::html()).body(result)
}

#[get("/openapi.json")]
async fn openapi() -> impl Responder {
    let mut doc = docs::ApiDoc::openapi();
    // doc.merge(api::auth::ApiDoc::openapi());
    doc.merge(api::user::ApiDoc::openapi());
    // doc.merge(api::vendor::ApiDoc::openapi());
    // doc.merge(api::verification::ApiVerificationDoc::openapi());
    // doc.merge(api::product::Doc::openapi());

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

fn config_static(app: &mut web::ServiceConfig) {
    if cfg!(debug_assertions) {
        app.service(af::Files::new("/static", "./static"));
        app.service(af::Files::new("/assets", "./static/dist/assets"));
        app.service(af::Files::new("/record", Config::RECORD_DIR));
    }
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenvy::from_path(".secrets.env").expect("could not read .secrets.env");
    pretty_env_logger::init();

    let _ = std::fs::create_dir(Config::RECORD_DIR);
    let pool = SqlitePool::connect("sqlite://main.db").await.unwrap();

    sqlx::migrate!().run(&pool).await.expect("migration failed");

    let server = HttpServer::new(move || {
        App::new()
            .wrap(middleware::Logger::new("%s %r %Ts"))
            .app_data(Data::new(AppState { sql: pool.clone() }))
            .configure(config_static)
            .service(openapi)
            .service(rapidoc)
            .service(index)
            .service(
                scope("/api")
                    // .service(api::auth::router())
                    .service(api::user::router())
                    // .service(api::vendor::router()),
            )
    });

    let server = if cfg!(debug_assertions) {
        server.bind(("127.0.0.1", 7200)).unwrap()
    } else {
        const PATH: &'static str = "/usr/share/nginx/sockets/simurgh.sock";
        let s = server.bind_uds(PATH).unwrap();
        std::fs::set_permissions(PATH, std::fs::Permissions::from_mode(0o777))?;
        s
    };

    server.run().await
}
