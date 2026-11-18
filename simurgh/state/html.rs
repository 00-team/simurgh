use crate::Config;
use crate::models::Horp;
use crate::models::user::{Admin, Usr};
use crate::staff::StaffSessions;
use crate::utils::ssr_eatery_page;
use actix_web::dev::HttpServiceFactory;
use actix_web::http::header::ContentType;
use actix_web::middleware::NormalizePath;
use actix_web::web::{Data, Query};
use actix_web::{FromRequest, HttpResponse, Scope, get, routes};
use actix_web::{HttpRequest, http::header, web};
use shah::Taker;
use shah::models::Gene;
use shah::models::perms::Perms;
use soil::{CompactGene, ListInput, Sost};
use std::collections::HashMap;
use std::str::FromStr;
// use std::sync::Mutex;
use std::time::Instant;
use tokio::sync::{Mutex, RwLock};

#[derive(Debug, Default)]
pub struct SsrCache {
    pub mem: RwLock<HashMap<String, String>>,
    pub eat: RwLock<HashMap<Gene, Vec<u8>>>,
}
