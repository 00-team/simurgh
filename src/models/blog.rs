use actix_web::{dev::Payload, web::Data, HttpRequest};
use serde::{Deserialize, Serialize};
use std::{future::Future, pin::Pin};
use utoipa::ToSchema;

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, ToSchema, Default)]
pub struct Blog {
    pub id: i64,
    pub slug: String,
    pub project: i64,
    pub author: i64,
    pub created_at: i64,
    pub updated_at: i64,
    pub thumbnail: Option<String>,
    pub read_time: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, ToSchema, Default)]
pub struct BlogContent {
    pub id: i64,
    pub blog: i64,
    pub lang: i64,
    pub title: String,
    pub detail: String,
    pub html: String,
    pub data: String,
}

impl actix_web::FromRequest for Blog {
    type Error = crate::models::AppErr;
    type Future = Pin<Box<dyn Future<Output = Result<Self, Self::Error>>>>;

    fn from_request(rq: &HttpRequest, pl: &mut Payload) -> Self::Future {
        let project = super::project::Project::from_request(rq, pl);
        let path = actix_web::web::Path::<(i64, i64)>::extract(rq);
        let state = rq.app_data::<Data<crate::AppState>>().unwrap();
        let pool = state.sql.clone();

        Box::pin(async move {
            let path = path.await?;
            let project = project.await?;
            let result = sqlx::query_as! {
                Blog,
                "select * from blogs where id = ? and project = ?",
                path.1, project.id
            }
            .fetch_one(&pool)
            .await?;

            Ok(result)
        })
    }
}


impl actix_web::FromRequest for BlogContent {
    type Error = crate::models::AppErr;
    type Future = Pin<Box<dyn Future<Output = Result<Self, Self::Error>>>>;

    fn from_request(rq: &HttpRequest, pl: &mut Payload) -> Self::Future {
        let blog = Blog::from_request(rq, pl);
        let path = actix_web::web::Path::<(i64, i64, i64)>::extract(rq);
        let state = rq.app_data::<Data<crate::AppState>>().unwrap();
        let pool = state.sql.clone();

        Box::pin(async move {
            let path = path.await?;
            let blog = blog.await?;
            let result = sqlx::query_as! {
                BlogContent,
                "select * from blog_contents where id = ? and blog = ?",
                path.2, blog.id
            }
            .fetch_one(&pool)
            .await?;

            Ok(result)
        })
    }
}
