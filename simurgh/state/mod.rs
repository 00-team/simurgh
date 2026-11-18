// mod html;
mod toll;
mod verification;

use tokio::sync::Mutex;
pub use toll::*;
pub use verification::*;

use sqlx::{
    SqlitePool,
    sqlite::{SqliteConnectOptions, SqliteJournalMode},
};
use std::str::FromStr;

use crate::{AppErr, models::Count};

pub struct SimurghDb {
    pub sql: SqlitePool,
    pub product_category_parent_lock: Mutex<u64>,
    pub product_media_lock: Mutex<u64>,
}

impl SimurghDb {
    pub async fn init() -> Self {
        let cpt = SqliteConnectOptions::from_str("sqlite://main.db")
            .expect("could not init sqlite connection options")
            .journal_mode(SqliteJournalMode::Off);

        let sql =
            SqlitePool::connect_with(cpt).await.expect("sqlite connection");
        Self {
            sql,
            product_category_parent_lock: Mutex::new(0),
            product_media_lock: Mutex::new(0),
        }
    }

    pub async fn count(&self, table: Tables) -> Result<Count, AppErr> {
        let q = format!("select COUNT(*) from {}", table.name());
        let (total,): (u32,) = sqlx::query_as(&q).fetch_one(&self.sql).await?;
        Ok(Count::new(total))
    }
}

#[derive(Clone, Copy)]
pub enum Tables {
    Users,
    // Admins,
    // Products,
    // ProductKinds,
    // ProductCategories,
    // Orders,
}

impl Tables {
    pub fn name(&self) -> &'static str {
        match self {
            Self::Users => "users",
            // Self::Admins => "admins",
            // Self::Products => "products",
            // Self::ProductKinds => "product_kinds",
            // Self::ProductCategories => "product_categories",
            // Self::Orders => "orders",
        }
    }
}
