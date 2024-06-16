use actix_web::{dev::Payload, web::Data, HttpRequest};
use serde::{Deserialize, Serialize};
use std::{future::Future, pin::Pin};
use utoipa::ToSchema;

use super::AppErrNotFound;

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, ToSchema, Default)]
pub struct Project {
    pub id: i64,
    pub user: Option<i64>,
    pub name: String,
    pub storage: i64,
    pub blog_count: i64,
    pub record_count: i64,
    pub created_at: i64,
    pub updated_at: i64,
    pub api_key: Option<String>,
}

impl actix_web::FromRequest for Project {
    type Error = crate::models::AppErr;
    type Future = Pin<Box<dyn Future<Output = Result<Self, Self::Error>>>>;

    fn from_request(rq: &HttpRequest, pl: &mut Payload) -> Self::Future {
        let user = super::user::User::from_request(rq, pl);
        let path = actix_web::web::Path::<(i64,)>::extract(rq);
        let state = rq.app_data::<Data<crate::AppState>>().unwrap();
        let pool = state.sql.clone();

        Box::pin(async move {
            let user = user.await?;
            let path = path.await?;
            let project = sqlx::query_as! {
                Project,
                "select * from projects where id = ?",
                path.0
            }
            .fetch_one(&pool)
            .await?;

            if project.user == user.id || user.admin {
                Ok(project)
            } else {
                Err(AppErrNotFound("یافت نشد"))
            }
        })
    }
}
