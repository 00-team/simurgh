use std::{future::Future, pin::Pin};

use actix_web::{
    dev::Payload,
    http::header::{HeaderValue, AUTHORIZATION, COOKIE},
    FromRequest, HttpMessage, HttpRequest,
};

use super::{AppErr, AppErrBadAuth};

#[derive(Debug, Clone)]
pub struct Authorization {
    pub prefix: String,
    pub token: String,
}

fn cookie_auth(cookie: &HeaderValue) -> Option<String> {
    cookie.as_bytes().split(|b| *b == b';').find_map(|cv| {
        let mut s = cv.splitn(2, |bb| *bb == b'=');
        let key = String::from_utf8(s.next()?.into()).ok()?;
        if key.trim().to_lowercase() != "authorization" {
            return None;
        }
        String::from_utf8(s.next()?.into()).ok()
    })
}

impl FromRequest for Authorization {
    type Error = AppErr;
    type Future = Pin<Box<dyn Future<Output = Result<Self, Self::Error>>>>;

    fn from_request(rq: &HttpRequest, _: &mut Payload) -> Self::Future {
        let rq = rq.clone();
        Box::pin(async move {
            if let Some(auth) = rq.extensions().get::<Authorization>() {
                return Ok(auth.clone());
            }

            let value = rq
                .headers()
                .get(AUTHORIZATION)
                .map_or(None, |v| v.to_str().map(|v| v.to_string()).ok())
                .or_else(|| rq.headers().get_all(COOKIE).find_map(cookie_auth))
                .ok_or(AppErrBadAuth(None))?;

            let mut tokens = value.splitn(2, ' ');
            let prefix = tokens
                .next()
                .map(|v| v.to_string())
                .ok_or(AppErrBadAuth(None))?
                .to_lowercase();

            let token = tokens
                .next()
                .map(|v| v.to_string())
                .ok_or(AppErrBadAuth(None))?;

            let auth = Authorization { token, prefix };
            let mut ext = rq.extensions_mut();
            ext.insert(auth.clone());
            Ok(auth)
        })
    }
}
