use crate::{models::auth::AuthUser, state::SimurghDb};

use super::AppErr;
use actix_web::{
    FromRequest, HttpMessage, HttpRequest, dev::Payload, web::Data,
};
use std::{future::Future, ops, pin::Pin};

#[potk::enum_int(u8)]
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Hash)]
#[derive(serde::Serialize, serde::Deserialize, utoipa::ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum VerificationAction {
    #[default]
    Login,
    Delete,
    // SetPassword,
}

#[derive(Debug, sqlx::FromRow, Default, Clone)]
#[derive(serde::Serialize, serde::Deserialize, utoipa::ToSchema)]
pub struct User {
    pub id: i64,
    pub phone: String,
    pub name: String,
    pub token: Option<String>,
    pub admin: bool,
    pub client: bool,
    pub banned: bool,
}

pub struct Admin(pub User);

impl ops::Deref for Admin {
    type Target = User;

    fn deref(&self) -> &User {
        &self.0
    }
}

impl ops::DerefMut for Admin {
    fn deref_mut(&mut self) -> &mut User {
        &mut self.0
    }
}

impl FromRequest for User {
    type Error = AppErr;
    type Future = Pin<Box<dyn Future<Output = Result<Self, Self::Error>>>>;

    fn from_request(rq: &HttpRequest, _: &mut Payload) -> Self::Future {
        let rq = rq.clone();

        Box::pin(async move {
            if let Some(user) = rq.extensions().get::<User>() {
                return Ok(user.clone());
            }

            let db = rq.app_data::<Data<SimurghDb>>().unwrap();
            let AuthUser { id, token } = AuthUser::try_from(&rq)?;

            let user = sqlx::query_as! {
                User,
                "select * from users where id = ? and token = ?",
                id, token
            }
            .fetch_one(&db.sql)
            .await?;

            if user.banned {
                return nest::err!(Forbidden);
            }

            let mut ext = rq.extensions_mut();
            ext.insert(user.clone());
            Ok(user)
        })
    }
}

impl FromRequest for Admin {
    type Error = AppErr;
    type Future = Pin<Box<dyn Future<Output = Result<Self, Self::Error>>>>;

    fn from_request(req: &HttpRequest, payload: &mut Payload) -> Self::Future {
        let user = User::from_request(req, payload);
        Box::pin(async {
            let user = user.await?;
            if !user.admin {
                return nest::err!(Forbidden);
            }

            Ok(Admin(user))
        })
    }
}
