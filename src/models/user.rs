use std::{future::Future, ops, pin::Pin};

use actix_web::{
    dev::Payload, web::Data, FromRequest, HttpMessage, HttpRequest,
};
use serde::{Deserialize, Serialize};
use sha2::Digest;
use utoipa::ToSchema;

use crate::{utils::CutOff, AppState};

use super::{auth::Authorization, AppErr, AppErrBadAuth, AppErrForbidden};

#[derive(
    Debug, Serialize, Deserialize, sqlx::FromRow, ToSchema, Default, Clone,
)]
pub struct User {
    pub id: i64,
    pub email: String,
    pub name: Option<String>,
    pub photo: Option<String>,
    pub token: String,
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

fn parse_token(token: &str) -> Option<(i64, String)> {
    let mut token = token.splitn(2, ':');
    let id = token.next()?.parse::<i64>().ok()?;
    let token = token.next()?.to_string();
    Some((id, token))
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

            let auth = Authorization::extract(&rq).await?;
            if auth.prefix != "bearer" {
                return Err(AppErrBadAuth(None));
            }

            let auth = parse_token(&auth.token).ok_or(AppErrBadAuth(None))?;
            let pool = &rq.app_data::<Data<AppState>>().unwrap().sql;
            let token = hex::encode(sha2::Sha512::digest(&auth.1));

            let mut user = sqlx::query_as! {
                User,
                "select * from users where id = ? and token = ?",
                auth.0, token
            }
            .fetch_one(pool)
            .await?;

            if user.banned {
                return Err(AppErrForbidden(Some("banned")));
            }

            user.token.cut_off(32);

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
                return Err(AppErrForbidden(None));
            }

            Ok(Admin(user))
        })
    }
}
