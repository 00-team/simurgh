use actix_web::{dev::Payload, web::Data, HttpRequest};
use serde::{Deserialize, Serialize};
use std::{future::Future, pin::Pin};
use utoipa::ToSchema;

use super::JsonStr;

super::sql_enum! {
    pub enum BlogStatus {
        Draft,
        Published,
    }
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Default)]
pub struct Style {
    color: Option<String>,
    bold: bool,
    italic: bool,
    underline: bool,
    font_size: u16,
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Default)]
pub enum TextDirection {
    #[default]
    LTR,
    RTL,
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Default)]
pub struct TextGroup {
    content: Vec<String>,
    style: Style,
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Default)]
pub enum BlogData {
    Text { dir: TextDirection, groups: Vec<TextGroup> },
    Image { record_id: i64, record_salt: String },
    #[default]
    Empty,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, ToSchema, Default)]
pub struct Blog {
    pub id: i64,
    pub slug: String,
    pub status: BlogStatus,
    pub project: i64,
    pub author: i64,
    pub created_at: i64,
    pub updated_at: i64,
    pub title: String,
    pub detail: String,
    pub html: String,
    #[schema(value_type = Vec<BlogData>)]
    pub data: JsonStr<Vec<BlogData>>,
    pub read_time: i64,
    pub thumbnail: Option<String>,
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
