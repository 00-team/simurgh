use crate::state::analytics::AnalyticsCache;
use crate::state::{GoojeWallet, SeedSettings};
use actix_web::web::Data;
use shah::{Taker, models::Gene};
use soil::user::{TransactionCurrecny, User, UserTransactionKind};
use std::collections::HashMap;
use tokio::sync::Mutex;

#[derive(Debug, Default)]
pub struct SeedTransactions {
    pub zibal: Mutex<HashMap<u64, ZibalTransaction>>,
    pub zarinpal: Mutex<HashMap<String, ZarinpalTransaction>>,
}

#[derive(Debug, Clone, Copy)]
pub enum TransactionAfterAction {
    ChargeWallet,
    PurchaseRob(u64),
}

impl TransactionAfterAction {
    pub async fn act(
        &self, user: &mut User, irr: u64, settings: &SeedSettings,
        ac: Data<AnalyticsCache>, taker: Data<Taker>,
    ) {
        match *self {
            TransactionAfterAction::ChargeWallet => {
                user.wallet.irr = user.wallet.irr.saturating_add(irr);
                settings.wallet_add(GoojeWallet { irr }).await;
            }
            TransactionAfterAction::PurchaseRob(rob) => {
                user.wallet.rob = user.wallet.rob.saturating_add(rob);
                AnalyticsCache::rob_purchase(ac, taker.clone());
                rob_purchase_transaction(&taker, &user.gene, rob, irr);
                settings.rob_sold(rob).await;
            }
        }

        if let Err(e) = sabad::user::set(&taker, user) {
            log::warn!("failed to update user: {:?} {e:?}", user.gene);
        }
    }
}

pub fn rob_purchase_transaction(
    taker: &Taker, user: &Gene, rob: u64, irr: u64,
) {
    let prtr = UserTransactionKind::rob_purchase(
        rob,
        irr,
        TransactionCurrecny::IranRial,
    )
    .to_model();
    let r = sabad::user::transaction_add(taker, user, &prtr);
    if let Err(e) = r {
        log::warn!(
            "failed to add rob purchase transaction: user: {user:?} err: {e:?}",
        );
    }
}

#[derive(Debug)]
pub struct ZibalTransaction {
    pub transaction: Gene,
    pub track_id: u64,
    pub irr: u64,
    pub user: Gene,
    pub aa: TransactionAfterAction,
    pub next: Option<String>,
}

#[derive(Debug)]
pub struct ZarinpalTransaction {
    pub transaction: Gene,
    pub authority: String,
    pub irr: u64,
    pub user: Gene,
    pub aa: TransactionAfterAction,
    pub next: Option<String>,
}
