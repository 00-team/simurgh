use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, ToSchema, Default)]
pub struct Blog {
    pub id: i64,
    pub slug: String,
    pub project: i64,
    pub author: i64,
    pub created_at: i64,
    pub updated_at: i64,
    pub thumbnail: Option<String>,
    pub read_time: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, ToSchema, Default)]
pub struct BlogContent {
    pub id: i64,
    pub blog: i64,
    pub lang: i64,
    pub title: String,
    pub detail: String,
    pub html: String,
    pub data: String,
}

// super::from_request!(Record, "records");
