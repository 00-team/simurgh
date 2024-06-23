use actix_web::{dev::Payload, web::Data, HttpRequest};
use serde::{Deserialize, Serialize};
use std::{fmt, future::Future, pin::Pin};
use utoipa::ToSchema;

use super::JsonStr;

super::sql_enum! {
    pub enum BlogStatus {
        Draft,
        Published,
    }
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Default, Clone)]
pub struct BlogStyle {
    pub color: Option<String>,
    pub bold: bool,
    pub italic: bool,
    pub underline: bool,
    pub code: bool,
    pub font_size: u16,
}

impl BlogStyle {
    pub fn css(&self) -> String {
        let mut style = vec![format!("font-size: {}px", self.font_size)];
        if let Some(c) = &self.color {
            if c.len() > 0 {
                style.push(format!("color: {c}"));
            }
        }
        if self.underline {
            style.push("text-decoration: underline".to_string());
        }
        style.join(";")
    }
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Default, Clone)]
#[serde(rename_all = "snake_case")]
pub enum BlogDirection {
    #[default]
    Ltr,
    Rtl,
}

impl fmt::Display for BlogDirection {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let out = match self {
            BlogDirection::Ltr => "ltr",
            BlogDirection::Rtl => "rtl",
        };
        write!(f, "{out}")
    }
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Default, Clone)]
#[serde(rename_all = "snake_case")]
pub enum BlogAlign {
    #[default]
    Left,
    Center,
    Right,
}

impl fmt::Display for BlogAlign {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let out = match self {
            BlogAlign::Left => "left",
            BlogAlign::Center => "center",
            BlogAlign::Right => "right",
        };
        write!(f, "{out}")
    }
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Default, Clone)]
pub struct BlogTextGroup {
    pub content: Vec<String>,
    pub style: BlogStyle,
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Default, Clone)]
#[serde(rename_all = "snake_case", tag = "kind")]
pub enum BlogData {
    Heading {
        level: u8,
        content: String,
        dir: BlogDirection,
        align: BlogAlign,
    },
    Text {
        dir: BlogDirection,
        align: BlogAlign,
        groups: Vec<BlogTextGroup>,
    },
    Image {
        record_id: i64,
        record_salt: String,
    },
    #[default]
    Empty,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, ToSchema, Default)]
pub struct Blog {
    pub id: i64,
    pub slug: String,
    pub status: BlogStatus,
    pub project: Option<i64>,
    pub author: Option<i64>,
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
