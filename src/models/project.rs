use crate::models::AppErr;
use crate::AppState;
use actix_web::dev::Payload;
use actix_web::{
    web::{Data, Path},
    FromRequest, HttpRequest,
};
use serde::{Deserialize, Serialize};
use std::{future::Future, pin::Pin};
use utoipa::ToSchema;

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, ToSchema, Default)]
pub struct Project {
    pub id: i64,
    pub user: i64,
    pub name: String,
    pub storage: i64,
    pub blog_count: i64,
    pub record_count: i64,
    pub timestamp: i64,
    pub api_key: Option<String>,
}

impl FromRequest for Project {
    type Error = AppErr;
    type Future = Pin<Box<dyn Future<Output = Result<Self, Self::Error>>>>;

    fn from_request(req: &HttpRequest, _: &mut Payload) -> Self::Future {
        let path = Path::<(i64,)>::extract(req);
        let state = req.app_data::<Data<AppState>>().unwrap();
        let pool = state.sql.clone();

        Box::pin(async move {
            let path = path.await?;
            let result = sqlx::query_as! {
                Project,
                "select * from projects where id = ?",
                path.0
            }
            .fetch_one(&pool)
            .await?;

            Ok(result)
        })
    }
}
