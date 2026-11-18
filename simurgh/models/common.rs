use actix_web::body::BoxBody;
use actix_web::web::Json;
use actix_web::{FromRequest, HttpRequest, Responder};
use actix_web::{HttpResponse, http::header::ContentType};
use serde::{Deserialize, Serialize, de::DeserializeOwned};
use sqlx::{
    Sqlite,
    encode::IsNull,
    sqlite::{SqliteArgumentValue, SqliteTypeInfo},
};
use std::ops;
use std::pin::Pin;
use utoipa::IntoParams;

pub type Response<T> = Result<Json<T>, super::AppErr>;

pub type Horp = Result<HttpResponse, crate::AppErr>;
pub type Jorp<T> = Result<Json<T>, crate::AppErr>;

#[derive(Deserialize, IntoParams)]
pub struct ListInput {
    #[param(example = 0)]
    pub page: u32,
}

#[derive(Debug)]
pub struct Html(pub String);

impl ops::Deref for Html {
    type Target = String;

    fn deref(&self) -> &String {
        &self.0
    }
}

impl Responder for Html {
    type Body = BoxBody;

    fn respond_to(self, _: &HttpRequest) -> HttpResponse<Self::Body> {
        HttpResponse::Ok().content_type(ContentType::html()).body(self.0)
    }
}

#[derive(Debug, Deserialize, Default, Clone)]
pub struct JsonStr<T>(pub T);

impl<T> ops::Deref for JsonStr<T> {
    type Target = T;

    fn deref(&self) -> &T {
        &self.0
    }
}

impl<T> ops::DerefMut for JsonStr<T> {
    fn deref_mut(&mut self) -> &mut T {
        &mut self.0
    }
}

impl<T: Serialize> Serialize for JsonStr<T> {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        self.0.serialize(serializer)
    }
}

impl<'q, T: Serialize> sqlx::Encode<'q, Sqlite> for JsonStr<T> {
    fn encode_by_ref(
        &self, buf: &mut <Sqlite as sqlx::Database>::ArgumentBuffer<'q>,
    ) -> Result<IsNull, sqlx::error::BoxDynError> {
        let result = serde_json::to_string(&self.0).unwrap_or("{}".to_string());
        buf.push(SqliteArgumentValue::Text(result.into()));

        Ok(IsNull::No)
    }
}

impl<T> sqlx::Type<Sqlite> for JsonStr<T> {
    fn type_info() -> SqliteTypeInfo {
        <&str as sqlx::Type<Sqlite>>::type_info()
    }
}

impl<T: DeserializeOwned + Default> From<String> for JsonStr<T> {
    fn from(value: String) -> Self {
        Self(serde_json::from_str::<T>(&value).unwrap_or_default())
    }
}

macro_rules! sql_enum {
    ($vis:vis enum $name:ident { $($member:ident,)* }) => {
        #[derive(PartialEq, Default, Clone, Debug, serde::Serialize, serde::Deserialize, utoipa::ToSchema)]
        #[serde(rename_all = "snake_case")]
        $vis enum $name {
            #[default]
            $($member,)*
        }

        impl From<i64> for $name {
            fn from(value: i64) -> Self {
                match value {
                    $(x if x == $name::$member as i64 => $name::$member,)*
                    _ => $name::default()
                }
            }
        }

        impl sqlx::Type<sqlx::Sqlite> for $name {
            fn type_info() -> sqlx::sqlite::SqliteTypeInfo {
                <i64 as sqlx::Type<sqlx::Sqlite>>::type_info()
            }
        }

        impl<'q> sqlx::Encode<'q, sqlx::Sqlite> for $name {
            fn encode_by_ref(
                &self, buf: &mut <sqlx::Sqlite as sqlx::Database>::ArgumentBuffer<'q>,
            ) -> Result<sqlx::encode::IsNull, sqlx::error::BoxDynError> {
                buf.push(sqlx::sqlite::SqliteArgumentValue::Int(self.clone() as i32));
                Ok(sqlx::encode::IsNull::No)
            }
        }

    };
}

macro_rules! from_request_under_project {
    ($name:ident, $table:literal) => {
impl actix_web::FromRequest for $name {
    type Error = crate::models::AppErr;
    type Future = std::pin::Pin<Box<dyn std::future::Future<Output = Result<Self, Self::Error>>>>;

    fn from_request(rq: &actix_web::HttpRequest, _: &mut actix_web::dev::Payload) -> Self::Future {
        let rq = rq.clone();
        Box::pin(async move {
            if let Some(result) = actix_web::HttpMessage::extensions(&rq).get::<$name>() {
                return Ok(result.clone());
            }

            let Ok(path) = actix_web::web::Path::<(i64, i64)>::extract(&rq).await else {
                return nest::err!(NotFound);
            };
            let project = super::project::Project::extract(&rq).await?;
            let db = rq.app_data::<actix_web::web::Data<crate::state::SimurghDb>>().unwrap();

            let result = sqlx::query_as! {
                $name,
                "select * from " + $table + " where id = ? AND project = ?",
                path.1, project.id
            }
            .fetch_one(&db.sql)
            .await?;

            let mut ext = actix_web::HttpMessage::extensions_mut(&rq);
            ext.insert(result.clone());

            Ok(result)
        })
    }
}
    };
}

pub(crate) use from_request_under_project;
pub(crate) use sql_enum;

#[derive(Debug, Hash, PartialEq, Eq, Clone, Copy)]
pub struct ClientIp {
    v4: [u8; 4],
}

impl ClientIp {
    pub fn new_v4(ipv4: &str) -> Result<Self, crate::AppErr> {
        let mut ci = Self { v4: [0; 4] };
        for (i, x) in ipv4.split('.').take(4).enumerate() {
            let Ok(v) = x.parse::<u8>() else {
                return nest::err!(InvalidIpv4);
            };
            ci.v4[i] = v;
        }
        Ok(ci)
    }
    #[allow(dead_code)]
    pub fn v4(&self) -> [u8; 4] {
        self.v4
    }
}

impl FromRequest for ClientIp {
    type Error = crate::AppErr;
    type Future = Pin<Box<dyn Future<Output = Result<Self, Self::Error>>>>;

    fn from_request(
        rq: &actix_web::HttpRequest, _: &mut actix_web::dev::Payload,
    ) -> Self::Future {
        let conn = rq.connection_info();
        let ip = conn.realip_remote_addr().map(|v| v.to_string());
        Box::pin(async move {
            let Some(ip) = ip else {
                return nest::err!(ServerError, "no ip");
            };

            ClientIp::new_v4(&ip)
        })
    }
}

pub const PAGE_SIZE: u32 = 32;

#[derive(Debug, Clone, Copy)]
#[derive(serde::Serialize, utoipa::ToSchema)]
pub struct Count {
    total: u32,
    max_page: u32,
}

impl Count {
    pub fn new(total: u32) -> Self {
        let mut max_page = 0u32;
        if total > 0 {
            max_page = (total - 1) / PAGE_SIZE;
        }

        Self { total, max_page }
    }
}
