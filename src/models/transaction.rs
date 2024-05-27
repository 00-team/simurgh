use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

use super::sql_enum;

sql_enum! {
    pub enum TransactionStatus {
        InProgress,
        Failed,
        Success,
    }
}

sql_enum! {
    pub enum TransactionKind {
        In,
        Out,
    }
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, ToSchema)]
pub struct Transaction {
    pub id: i64,
    pub user: i64,
    pub kind: TransactionKind,
    pub status: TransactionStatus,
    pub amount: i64,
    pub timestamp: i64,
    pub authority: String,
    pub ref_id: Option<i64>,
    pub card: Option<String>,
    pub card_hash: Option<String>,
}
