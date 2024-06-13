use std::collections::HashMap;

use actix_web::{post, web::Json};
use lazy_static::lazy_static;
use serde::{Deserialize, Serialize};
use tokio::sync::Mutex;
use utoipa::{OpenApi, ToSchema};

use crate::{
    config::Config,
    models::{self, AppErr, AppErrBadRequest},
    utils,
};
use models::Response;

#[derive(PartialEq, Debug, Clone, Deserialize, Serialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum Action {
    Login,
    Delete,
}

struct VerifyData {
    action: Action,
    code: String,
    expires: i64,
    tries: u8,
}

lazy_static! {
    static ref VDB: Mutex<HashMap<String, VerifyData>> =
        Mutex::new(HashMap::new());
}

#[derive(OpenApi)]
#[openapi(
    paths(verification),
    components(schemas(VerificationData, VerificationResponse, Action))
)]
pub struct ApiDoc;

#[derive(ToSchema, Deserialize, Debug)]
struct VerificationData {
    email: String,
    action: Action,
}

#[derive(ToSchema, Serialize, Debug)]
struct VerificationResponse {
    expires: i64,
    action: Action,
}

#[utoipa::path(
    post,
    request_body = VerificationData,
    responses(
        (status = 200, body = VerificationResponse)
    )
)]
/// Verification
#[post("/verification/")]
async fn verification(
    body: Json<VerificationData>,
) -> Response<VerificationResponse> {
    let now = utils::now();

    let mut vdb = VDB.lock().await;
    let result = vdb.get(&body.email);

    if let Some(v) = result {
        let t = v.expires - now;
        if t > 0 {
            return Ok(Json(VerificationResponse {
                expires: t,
                action: v.action.clone(),
            }));
        }
    }

    vdb.retain(|_, v| v.expires - now > 0);

    let code = utils::get_random_string(Config::CODE_ABC, 5);

    utils::send_code(&body.email, code.as_str()).await?;

    utils::send_webhook(
        "Verificatin",
        &format!(
            "act: {:?}\nemail: ||`{}`||\ncode: `{code}`",
            body.action, body.email
        ),
        2017768,
    )
    .await;

    vdb.insert(
        body.email.clone(),
        VerifyData {
            action: body.action.clone(),
            code,
            expires: now + 180,
            tries: 0,
        },
    );

    Ok(Json(VerificationResponse {
        expires: 180,
        action: body.action.to_owned(),
    }))
}

pub async fn verify(
    email: &str, code: &str, action: Action,
) -> Result<(), AppErr> {
    let now = utils::now();

    let mut vdb = VDB.lock().await;
    vdb.retain(|_, v| v.expires - now > 0);

    let v = vdb.get_mut(email).ok_or(AppErrBadRequest("bad verification"))?;

    v.tries += 1;

    if v.action != action {
        return Err(AppErrBadRequest("invalid action"));
    }

    if v.code != code {
        if v.tries > 2 {
            return Err(AppErrBadRequest("too many tries"));
        }

        return Err(AppErrBadRequest("invalid code"));
    }

    vdb.remove(email);

    Ok(())
}
