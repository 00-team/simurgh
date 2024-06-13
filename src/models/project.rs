use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, ToSchema, Default)]
pub struct Project {
    pub id: i64,
    pub user: i64,
    pub name: String,
    pub storage: i64,
    pub blog_count: i64,
    pub record_count: i64,
    pub created_at: i64,
    pub updated_at: i64,
    pub api_key: Option<String>,
}

super::from_request!(Project, "projects");
