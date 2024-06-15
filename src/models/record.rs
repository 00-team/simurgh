use actix_web::{dev::Payload, web::Data, HttpRequest};
use serde::{Deserialize, Serialize};
use std::{future::Future, pin::Pin};
use utoipa::ToSchema;

use super::AppErrNotFound;

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, ToSchema, Default)]
pub struct Record {
    pub id: i64,
    pub project: Option<i64>,
    pub salt: String,
    pub size: i64,
    pub created_at: i64,
    pub updated_at: i64,
    pub mime: Option<String>,
    pub ext: Option<String>,
}

impl actix_web::FromRequest for Record {
    type Error = crate::models::AppErr;
    type Future = Pin<Box<dyn Future<Output = Result<Self, Self::Error>>>>;

    fn from_request(rq: &HttpRequest, pl: &mut Payload) -> Self::Future {
        let user = super::user::User::from_request(rq, pl);
        let project = super::project::Project::from_request(rq, pl);
        let path = actix_web::web::Path::<(i64, i64)>::extract(rq);
        let state = rq.app_data::<Data<crate::AppState>>().unwrap();
        let pool = state.sql.clone();

        Box::pin(async move {
            let user = user.await?;
            let path = path.await?;
            let project = project.await?;
            let record = sqlx::query_as! {
                Record,
                "select * from records where id = ?",
                path.1
            }
            .fetch_one(&pool)
            .await?;

            if record.project == Some(project.id) || user.admin {
                Ok(record)
            } else {
                Err(AppErrNotFound("یافت نشد"))
            }
        })
    }
}
