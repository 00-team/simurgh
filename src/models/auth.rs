use actix_web::HttpRequest;

use super::{AppErr, AppErrBadAuth};

pub enum Authorization {
    User { id: i64, token: String },
    Project { id: i64, token: String },
}

fn tokenizer<const N: usize>(value: Option<&str>) -> Result<[&str; N], AppErr> {
    if value.is_none() {
        return Err(AppErrBadAuth(None));
    }
    let result: [&str; N] = value
        .unwrap()
        .splitn(N, ':')
        .collect::<Vec<&str>>()
        .try_into()
        .map_err(|_| AppErrBadAuth(None))?;

    Ok(result)
}

impl TryFrom<&str> for Authorization {
    type Error = AppErr;
    fn try_from(value: &str) -> Result<Self, Self::Error> {
        let mut tokens = value.splitn(2, ' ');
        let key = tokens.next().map(|v| v.to_lowercase());
        if key.is_none() {
            return Err(AppErrBadAuth(None));
        }

        match key.unwrap().as_str() {
            "user" => {
                let [id, token] = tokenizer(tokens.next())?;
                Ok(Authorization::User {
                    id: id.parse()?,
                    token: token.to_string(),
                })
            }
            "project" => {
                let [id, token] = tokenizer(tokens.next())?;
                Ok(Authorization::Project {
                    id: id.parse()?,
                    token: token.to_string(),
                })
            }
            key => {
                Err(AppErrBadAuth(Some(&format!("unknown key in auth: {key}"))))
            }
        }
    }
}

impl TryFrom<&HttpRequest> for Authorization {
    type Error = AppErr;

    fn try_from(rq: &HttpRequest) -> Result<Self, Self::Error> {
        if let Some(value) = rq.headers().get("authorization") {
            return Authorization::try_from(value.to_str()?);
        }

        for hdr in rq.headers().get_all("cookie") {
            for cookie in hdr.as_bytes().split(|v| *v == b';') {
                let mut s = cookie.splitn(2, |v| *v == b'=');

                let k = s.next().and_then(|v| String::from_utf8(v.into()).ok());
                let v = s.next().and_then(|v| String::from_utf8(v.into()).ok());
                if k.is_none() || v.is_none() {
                    continue;
                }

                if k.unwrap().trim().to_lowercase() == "authorization" {
                    match Authorization::try_from(v.unwrap().as_str()) {
                        Ok(v) => return Ok(v),
                        Err(_) => {}
                    }
                }
            }
        }

        Err(AppErrBadAuth(None))
    }
}
