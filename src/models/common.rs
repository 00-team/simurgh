use std::ops;

use actix_web::web::Json;
use serde::{de::DeserializeOwned, Deserialize, Serialize};
use sqlx::{
    encode::IsNull,
    sqlite::{SqliteArgumentValue, SqliteTypeInfo},
    Sqlite,
};
use utoipa::IntoParams;

pub type Response<T> = Result<Json<T>, super::AppErr>;

#[derive(Deserialize, IntoParams)]
pub struct ListInput {
    #[param(example = 0)]
    pub page: u32,
}

#[derive(Debug, Deserialize, Default)]
pub struct JsonStr<T>(pub T);

// impl<T> JsonStr<T> {
//     pub fn into_inner(self) -> T {
//         self.0
//     }
// }

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
        &self,
        buf: &mut <Sqlite as sqlx::database::HasArguments<'q>>::ArgumentBuffer,
    ) -> IsNull {
        let result = serde_json::to_string(&self.0).unwrap_or("{}".to_string());
        buf.push(SqliteArgumentValue::Text(result.into()));

        IsNull::No
    }
}

impl<T> sqlx::Type<Sqlite> for JsonStr<T> {
    fn type_info() -> SqliteTypeInfo {
        <&str as sqlx::Type<Sqlite>>::type_info()
    }
}

impl<T: DeserializeOwned + Default> From<String> for JsonStr<T> {
    fn from(value: String) -> Self {
        Self(serde_json::from_str::<T>(&value).unwrap_or(T::default()))
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
                &self,
                buf: &mut <sqlx::Sqlite as sqlx::database::HasArguments<'q>>::ArgumentBuffer,
            ) -> sqlx::encode::IsNull {
                buf.push(sqlx::sqlite::SqliteArgumentValue::Int(self.clone() as i32));
                sqlx::encode::IsNull::No
            }
        }
    };
}

macro_rules! from_request {
    ($name:ident, $table:literal) => {
        impl actix_web::FromRequest for $name {
            type Error = crate::models::AppErr;
            type Future = std::pin::Pin<
                Box<
                    dyn std::future::Future<Output = Result<Self, Self::Error>>,
                >,
            >;

            fn from_request(
                req: &actix_web::HttpRequest, _: &mut actix_web::dev::Payload,
            ) -> Self::Future {
                let path = actix_web::web::Path::<(i64,)>::extract(req);
                let state = req
                    .app_data::<actix_web::web::Data<crate::AppState>>()
                    .unwrap();
                let pool = state.sql.clone();

                Box::pin(async move {
                    let path = path.await?;
                    let result = sqlx::query_as! {
                        $name,
                        "select * from " + $table + " where id = ?",
                        path.0
                    }
                    .fetch_one(&pool)
                    .await?;

                    Ok(result)
                })
            }
        }
    };
}

pub(crate) use from_request;
pub(crate) use sql_enum;
