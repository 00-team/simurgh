use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Debug, Serialize, Deserialize, ToSchema, Clone)]
#[serde(tag = "kind", rename_all = "snake_case")]
pub enum RecordUsage {
    Blog { id: i64 },
    Free { reason: String },
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, ToSchema, Clone)]
pub struct Record {
    pub id: i64,
    pub project: Option<i64>,
    pub name: String,
    pub salt: String,
    pub size: i64,
    pub created_at: i64,
    pub mime: Option<String>,
    #[schema(value_type = Vec<RecordUsage>)]
    pub usages: super::JsonStr<Vec<RecordUsage>>,
}

super::from_request_under_project!(Record, "records");
