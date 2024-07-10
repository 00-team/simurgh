use actix_web::{dev::Payload, web::Data, HttpMessage, HttpRequest};
use serde::{Deserialize, Serialize};
use std::{future::Future, pin::Pin};
use utoipa::ToSchema;

use super::{auth::Authorization, AppErrBadAuth, AppErrNotFound};

#[derive(
    Debug, Serialize, Deserialize, sqlx::FromRow, ToSchema, Default, Clone,
)]
pub struct Project {
    pub id: i64,
    pub user: Option<i64>,
    pub name: String,
    pub storage: i64,
    pub blog_count: i64,
    pub blog_category_count: i64,
    pub blog_tag_count: i64,
    pub record_count: i64,
    pub created_at: i64,
    pub updated_at: i64,
    pub api_key: Option<String>,
}

#[derive(Debug)]
struct ApiKey(String);

impl actix_web::FromRequest for ApiKey {
    type Error = crate::models::AppErr;
    type Future = Pin<Box<dyn Future<Output = Result<Self, Self::Error>>>>;

    fn from_request(rq: &HttpRequest, _: &mut Payload) -> Self::Future {
        let rq = rq.clone();
        Box::pin(async move {
            let auth = Authorization::extract(&rq).await?;
            if auth.prefix != "api-key" {
                return Err(AppErrBadAuth(None));
            }
            Ok(ApiKey(auth.token))
        })
    }
}

impl actix_web::FromRequest for Project {
    type Error = crate::models::AppErr;
    type Future = Pin<Box<dyn Future<Output = Result<Self, Self::Error>>>>;

    fn from_request(rq: &HttpRequest, _: &mut Payload) -> Self::Future {
        let rq = rq.clone();
        Box::pin(async move {
            if let Some(project) = rq.extensions().get::<Project>() {
                return Ok(project.clone());
            }

            let pool = &rq.app_data::<Data<crate::AppState>>().unwrap().sql;
            let path = actix_web::web::Path::<(i64,)>::extract(&rq).await?;
            let project = sqlx::query_as! {
                Project,
                "select * from projects where id = ?",
                path.0
            }
            .fetch_one(pool)
            .await?;

            if let Ok(user) = super::user::User::extract(&rq).await {
                if !user.admin && project.user != Some(user.id) {
                    return Err(AppErrNotFound(None));
                }
            } else if let Ok(api_key) = ApiKey::extract(&rq).await {
                if project.api_key != Some(api_key.0) {
                    return Err(AppErrNotFound(None));
                }
            } else {
                return Err(AppErrNotFound(None));
            }

            let mut ext = rq.extensions_mut();
            ext.insert(project.clone());

            Ok(project)
        })
    }
}
