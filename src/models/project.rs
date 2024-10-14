use actix_web::{dev::Payload, web::Data, HttpMessage, HttpRequest};
use serde::{Deserialize, Serialize};
use std::{future::Future, pin::Pin};
use utoipa::ToSchema;

use super::{auth::Authorization, AppErrNotFound};

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

impl actix_web::FromRequest for Project {
    type Error = crate::models::AppErr;
    type Future = Pin<Box<dyn Future<Output = Result<Self, Self::Error>>>>;

    fn from_request(rq: &HttpRequest, _: &mut Payload) -> Self::Future {
        let auth = Authorization::try_from(rq);
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

            match auth? {
                Authorization::User { .. } => {
                    if let Ok(user) = super::user::User::extract(&rq).await {
                        if !user.admin && project.user != Some(user.id) {
                            return Err(AppErrNotFound(None));
                        }
                    }
                }
                Authorization::Project { id, token } => {
                    if project.id != id || project.api_key != Some(token) {
                        return Err(AppErrNotFound(None));
                    }
                }
            }

            let mut ext = rq.extensions_mut();
            ext.insert(project.clone());

            Ok(project)
        })
    }
}
