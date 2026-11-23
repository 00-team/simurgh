use actix_web::{HttpMessage, HttpRequest, dev::Payload, web::Data};
use std::{future::Future, pin::Pin};

use crate::{models::auth::AuthProject, state::SimurghDb};

#[derive(Debug, sqlx::FromRow, Default, Clone)]
#[derive(serde::Serialize, serde::Deserialize, utoipa::ToSchema)]
pub struct Project {
    pub id: i64,
    pub owner: Option<i64>,
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
        // let auth = AuthUser::try_from(rq);
        let rq = rq.clone();
        Box::pin(async move {
            if let Some(project) = rq.extensions().get::<Project>() {
                return Ok(project.clone());
            }

            let db = rq.app_data::<Data<SimurghDb>>().unwrap();
            let Ok(path) = actix_web::web::Path::<(i64,)>::extract(&rq).await
            else {
                return nest::err!(NotFound, "no project id in path");
            };
            let project = sqlx::query_as! {
                Project,
                "select * from projects where id = ?",
                path.0
            }
            .fetch_one(&db.sql)
            .await?;

            if let Ok(ap) = AuthProject::try_from(&rq) {
                if ap.id != project.id || project.api_key != Some(ap.token) {
                    return nest::err!(NotFound);
                }
            } else if let Ok(user) = super::user::User::extract(&rq).await
                && !user.admin
                && project.owner != Some(user.id)
            {
                return nest::err!(NotFound);
            }

            let mut ext = rq.extensions_mut();
            ext.insert(project.clone());

            Ok(project)
        })
    }
}
