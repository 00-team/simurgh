use serde::{Deserialize, Serialize};
use std::fmt;
use utoipa::ToSchema;

use super::JsonStr;

super::sql_enum! {
    pub enum BlogStatus {
        Draft,
        Published,
    }
}

#[derive(
    Debug, Serialize, Deserialize, sqlx::FromRow, ToSchema, Default, Clone,
)]
pub struct BlogCategory {
    pub id: i64,
    pub slug: String,
    pub project: i64,
    pub label: String,
    pub detail: String,
    pub count: i64,
}

#[derive(
    Debug, Serialize, Deserialize, sqlx::FromRow, ToSchema, Default, Clone,
)]
pub struct BlogTag {
    pub id: i64,
    pub slug: String,
    pub project: i64,
    pub label: String,
    pub detail: String,
    pub count: i64,
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Default, Clone)]
pub struct BlogStyle {
    pub color: Option<String>,
    pub bold: bool,
    pub italic: bool,
    pub underline: bool,
    pub code: bool,
    pub mark: bool,
    pub font_size: u16,
    pub font_family: Option<String>,
}

impl BlogStyle {
    pub fn css(&self) -> String {
        let mut style =
            vec![("font-size", Some(format!("{}px", self.font_size)))];
        style.push(("color", self.color.clone()));
        style.push(("font-family", self.font_family.clone()));
        if self.underline {
            style.push(("text-decoration", Some("underline".to_string())));
        }

        style
            .iter()
            .filter_map(|(k, v)| {
                if let Some(v) = v {
                    if v.len() > 0 {
                        return Some(format!("{k}: {v}"));
                    }
                }
                None
            })
            .collect::<Vec<_>>()
            .join(";")
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
    pub url: Option<String>,
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
        record_id: Option<i64>,
        url: String,
        align: BlogAlign,
        alt: String,
    },
    Break,
    #[default]
    Empty,
}

#[derive(
    Debug, Serialize, Deserialize, sqlx::FromRow, ToSchema, Default, Clone,
)]
pub struct Blog {
    pub id: i64,
    pub slug: String,
    pub status: BlogStatus,
    pub author: Option<i64>,
    pub project: Option<i64>,
    pub category: Option<i64>,
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

super::from_request_under_project!(Blog, "blogs");
super::from_request_under_project!(BlogCategory, "blog_categories");
super::from_request_under_project!(BlogTag, "blog_tags");
