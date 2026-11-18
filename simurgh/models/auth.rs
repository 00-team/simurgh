use crate::AppErr;
use actix_web::HttpRequest;

macro_rules! auth {
    ($name:ident, $key:literal, {  $($field:ident : $ty:ty),* $(,)? }) => {
        pub struct $name { $(pub $field : $ty),* }

impl TryFrom<&HttpRequest> for $name {
    type Error = AppErr;

    fn try_from(rq: &HttpRequest) -> Result<Self, Self::Error> {
        if let Some(value) = rq.headers().get($key) {
            return $name::try_from(value.to_str()?);
        }

        if let Some(value) = rq.cookie($key) {
            return $name::try_from(value.value());
        }

        // for hdr in rq.headers().get_all("cookie") {
        //     let Ok(hv) = hdr.to_str() else { continue };
        //     for cookie in hv.split(';') {
        //         let mut s = cookie.splitn(2, '=');
        //
        //         let Some(k) = s.next().map(|v| v.trim()) else { continue };
        //         let Some(v) = s.next().map(|v| v.trim()) else { continue };
        //
        //         if k.to_lowercase() == $key {
        //             if let Ok(v) = $name::try_from(v) {
        //                 return Ok(v);
        //             }
        //         }
        //     }
        // }

        nest::err!(BadAuth)
    }
}
    };
}

auth!(AuthUser, "x-simurgh-auth-user", { id: i64, token: String });
auth!(AuthProject, "x-simurgh-auth-project", { id: i64, token: String });
// auth!(AuthSsr, "x-dokon-auth-ssr", { pass: String });

impl TryFrom<&str> for AuthUser {
    type Error = AppErr;
    fn try_from(value: &str) -> Result<Self, Self::Error> {
        let [id, token] = tokenizer(value)?;
        let Ok(id) = id.parse::<i64>() else {
            return nest::err!(BadAuth, "invalid id");
        };
        Ok(Self { id, token: token.to_string() })
    }
}

impl TryFrom<&str> for AuthProject {
    type Error = AppErr;
    fn try_from(value: &str) -> Result<Self, Self::Error> {
        let [id, token] = tokenizer(value)?;
        let Ok(id) = id.parse::<i64>() else {
            return nest::err!(BadAuth, "invalid id");
        };
        Ok(Self { id, token: token.to_string() })
    }
}

// impl TryFrom<&str> for AuthSsr {
//     type Error = AppErr;
//     fn try_from(value: &str) -> Result<Self, Self::Error> {
//         let [pass] = tokenizer(value)?;
//         Ok(Self { pass: pass.to_string() })
//     }
// }

fn tokenizer<const N: usize>(value: &str) -> Result<[&str; N], AppErr> {
    let mut result: [&str; N] = [""; N];
    let mut v = value.splitn(N, ':');
    for slot in result.iter_mut() {
        let Some(s) = v.next() else {
            return nest::err!(BadAuth);
        };
        *slot = s;
    }

    Ok(result)
}

// use actix_web::HttpRequest;
//
// use super::{AppErr, AppErrBadAuth};
//
// pub enum Authorization {
//     User { id: i64, token: String },
//     Project { id: i64, token: String },
// }
//
// fn tokenizer<const N: usize>(value: Option<&str>) -> Result<[&str; N], AppErr> {
//     if value.is_none() {
//         return Err(AppErrBadAuth(None));
//     }
//     let result: [&str; N] = value
//         .unwrap()
//         .splitn(N, ':')
//         .collect::<Vec<&str>>()
//         .try_into()
//         .map_err(|_| AppErrBadAuth(None))?;
//
//     Ok(result)
// }
//
// impl TryFrom<&str> for Authorization {
//     type Error = AppErr;
//     fn try_from(value: &str) -> Result<Self, Self::Error> {
//         let mut tokens = value.splitn(2, ' ');
//         let key = tokens.next().map(|v| v.to_lowercase());
//         if key.is_none() {
//             return Err(AppErrBadAuth(None));
//         }
//
//         match key.unwrap().as_str() {
//             "user" => {
//                 let [id, token] = tokenizer(tokens.next())?;
//                 Ok(Authorization::User {
//                     id: id.parse()?,
//                     token: token.to_string(),
//                 })
//             }
//             "project" => {
//                 let [id, token] = tokenizer(tokens.next())?;
//                 Ok(Authorization::Project {
//                     id: id.parse()?,
//                     token: token.to_string(),
//                 })
//             }
//             key => {
//                 Err(AppErrBadAuth(Some(&format!("unknown key in auth: {key}"))))
//             }
//         }
//     }
// }
//
// impl TryFrom<&HttpRequest> for Authorization {
//     type Error = AppErr;
//
//     fn try_from(rq: &HttpRequest) -> Result<Self, Self::Error> {
//         if let Some(value) = rq.headers().get("authorization") {
//             return Authorization::try_from(value.to_str()?);
//         }
//
//         for hdr in rq.headers().get_all("cookie") {
//             for cookie in hdr.as_bytes().split(|v| *v == b';') {
//                 let mut s = cookie.splitn(2, |v| *v == b'=');
//
//                 let k = s.next().and_then(|v| String::from_utf8(v.into()).ok());
//                 let v = s.next().and_then(|v| String::from_utf8(v.into()).ok());
//                 let Some(k) = k else { continue };
//                 let Some(v) = v else { continue };
//
//                 if k.trim().to_lowercase() == "authorization" {
//                     if let Ok(v) = Authorization::try_from(v.as_str()) {
//                         return Ok(v);
//                     }
//                 }
//             }
//         }
//
//         Err(AppErrBadAuth(None))
//     }
// }
//
//
// struct AuthUser;
//
// impl TryFrom<&HttpRequest> for AuthUser {
//     type Error = AppErr;
//
//     fn try_from(rq: &HttpRequest) -> Result<Self, Self::Error> {
//         if let Some(value) = rq.headers().get("auth") {
//             // return $name::try_from(value.to_str()?);
//         }
//
//         if let Some(c) = rq.cookie("auth") {
//             c.value()
//         };
//
//         for hdr in rq.headers().get_all("cookie") {
//             let Ok(hv) = hdr.to_str() else { continue };
//             for cookie in hv.split(';') {
//                 let mut s = cookie.splitn(2, '=');
//
//                 let Some(k) = s.next().map(|v| v.trim()) else { continue };
//                 let Some(v) = s.next().map(|v| v.trim()) else { continue };
//
//                 if k.to_lowercase() == $key {
//                     if let Ok(v) = $name::try_from(v) {
//                         return Ok(v);
//                     }
//                 }
//             }
//         }
//
//         anbar::err!(BadAuth)
//     }
// }
