use serde::de::DeserializeOwned;
use sqlx::{
    Sqlite,
    encode::IsNull,
    sqlite::{SqliteArgumentValue, SqliteTypeInfo},
};
use std::ops;

#[derive(Debug, serde::Deserialize, Default, Clone, Copy)]
pub struct JsonStr<T>(pub T);

// impl<T: utoipa::PartialSchema> utoipa::__dev::ComposeSchema for JsonStr<T> {
//     fn compose(
//         _: Vec<utoipa::openapi::RefOr<utoipa::openapi::schema::Schema>>,
//     ) -> utoipa::openapi::RefOr<utoipa::openapi::schema::Schema> {
//         <T as utoipa::PartialSchema>::schema()
//     }
// }
//
// impl<T: utoipa::ToSchema> utoipa::ToSchema for JsonStr<T> {
//     fn schemas(
//         schemas: &mut Vec<(
//             String,
//             utoipa::openapi::RefOr<utoipa::openapi::schema::Schema>,
//         )>,
//     ) {
//         T::schemas(schemas)
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

impl<T: serde::Serialize> serde::Serialize for JsonStr<T> {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        self.0.serialize(serializer)
    }
}

impl<'q, T: serde::Serialize> sqlx::Encode<'q, Sqlite> for JsonStr<T> {
    fn encode_by_ref(
        &self, buf: &mut <Sqlite as sqlx::Database>::ArgumentBuffer<'q>,
    ) -> Result<IsNull, sqlx::error::BoxDynError> {
        let result = serde_json::to_string(&self.0).unwrap_or("{}".to_string());
        buf.push(SqliteArgumentValue::Text(result.into()));

        Ok(IsNull::No)
    }
}

impl<'q, T: DeserializeOwned + Default> sqlx::Decode<'q, sqlx::Sqlite>
    for JsonStr<T>
{
    fn decode(
        value: <sqlx::Sqlite as sqlx::Database>::ValueRef<'q>,
    ) -> Result<Self, sqlx::error::BoxDynError> {
        let str = <&str as sqlx::Decode<sqlx::Sqlite>>::decode(value)?;
        Ok(serde_json::from_str(str).unwrap_or_default())
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
