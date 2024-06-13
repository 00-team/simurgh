use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, ToSchema, Default)]
pub struct Record {
    pub id: i64,
    pub project: Option<i64>,
    pub salt: String,
    pub size: i64,
    pub created_at: i64,
    pub updated_at: i64,
    pub mime: Option<String>,
    pub ext: Option<String>,
}

super::from_request!(Record, "records");
