use std::{future::Future, pin::Pin};

use actix_web::dev::Payload;
use actix_web::{
    web::{Data, Path},
    FromRequest, HttpRequest,
};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

use crate::AppState;

use super::AppErr;

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, ToSchema)]
pub struct Message {
    pub id: i64,
    pub user: i64,
    pub activation_id: i64,
    pub timestamp: i64,
    pub text: String,
    pub code: String,
    pub country: String,
    pub service: String,
    pub received_at: String,
    pub seen: bool,
}

impl FromRequest for Message {
    type Error = AppErr;
    type Future = Pin<Box<dyn Future<Output = Result<Self, Self::Error>>>>;

    fn from_request(req: &HttpRequest, _: &mut Payload) -> Self::Future {
        let path = Path::<(i64,)>::extract(req);
        let state = req.app_data::<Data<AppState>>().unwrap();
        let pool = state.sql.clone();

        Box::pin(async move {
            let path = path.await?;
            let result = sqlx::query_as! {
                Message,
                "select * from messages where id = ?",
                path.0
            }
            .fetch_one(&pool)
            .await?;

            Ok(result)
        })
    }
}
