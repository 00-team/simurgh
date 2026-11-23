use sqlx::SqlitePool;

use crate::{AppErr, models::record::Record};

pub async fn record_get(pool: &SqlitePool, rid: i64) -> Result<Record, AppErr> {
    Ok(sqlx::query_as! {
        Record, "select * from records where id = ?", rid
    }
    .fetch_one(pool)
    .await?)
}
