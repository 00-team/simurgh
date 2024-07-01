use actix_web::dev::HttpServiceFactory;
use actix_web::http::header::ContentType;
use actix_web::middleware::NormalizePath;
use actix_web::{routes, HttpResponse, Scope};
use std::fs::read_to_string;

#[routes]
#[get("/")]
#[get("/projects")]
#[get("/projects/{pid}")]
#[get("/projects/{pid}/records")]
#[get("/projects/{pid}/blogs")]
#[get("/projects/{pid}/blogs/{bid}")]
#[get("/projects/{pid}/blogs/{bid}/editor")]
async fn app_index() -> HttpResponse {
    let result = read_to_string("app/dist/index.html")
        .unwrap_or("err reading app index.html".to_string());
    HttpResponse::Ok().content_type(ContentType::html()).body(result)
}

#[routes]
#[get("/simple")]
#[get("/simple/projects")]
#[get("/simple/projects/{pid}")]
#[get("/simple/projects/{pid}/records")]
#[get("/simple/projects/{pid}/blogs")]
#[get("/simple/projects/{pid}/blogs/{bid}")]
#[get("/simple/projects/{pid}/blogs/{bid}/editor")]
async fn simple_index() -> HttpResponse {
    let result = read_to_string("simple/dist/index.html")
        .unwrap_or("err reading simple index.html".to_string());
    HttpResponse::Ok().content_type(ContentType::html()).body(result)
}

pub fn router() -> impl HttpServiceFactory {
    Scope::new("")
        .wrap(NormalizePath::trim())
        .service(app_index)
        .service(simple_index)
}
