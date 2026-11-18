use crate::Config;
use crate::docs::UpdatePaths;
use crate::models::ClientIp;
use crate::models::Jorp;
use crate::models::user::VerificationAction;
use crate::state::{Toll, VerificationState, VerificationTimes};
use actix_web::web::Data;
use actix_web::{post, web::Json};
use nest::utils::random_string;
use nest::utils::user_phone_validator;
// use anbar::user::VerificationAction;
// use anbar::user::VerificationData;

#[derive(utoipa::OpenApi)]
#[openapi(
    tags((name = "api")),
    paths(verification),
    components(schemas(
        // VerificationData, VerificationAction, VerificationTimes
    )),
    modifiers(&UpdatePaths)
)]
pub struct ApiDoc;

#[derive(serde::Serialize, utoipa::ToSchema, serde::Deserialize)]
pub struct VerificationData {
    pub phone: String,
    pub action: VerificationAction,
}

#[utoipa::path(
    post,
    request_body = VerificationData,
    responses((status = 200, body = VerificationTimes))
)]
/// Verification
#[post("/verification/")]
async fn verification(
    ip: ClientIp, body: Json<VerificationData>, toll: Data<Toll>,
    state: Data<VerificationState>,
) -> Jorp<VerificationTimes> {
    toll.verification_check(&ip).await?;
    // TODO: add a api for logged in verification

    user_phone_validator(&body.phone)?;

    let key = (body.phone.clone(), body.action);

    let code = random_string(Config::CODE_ABC, 5);
    let exp = state.add_code(key, code.clone()).await?;

    if exp.added {
        log::info!("login {} code: {code}", body.phone);

        #[cfg(not(debug_assertions))]
        crate::utils::send_sms_prefab(&body.phone, 384074, vec![code.clone()])
            .await;
    }

    Ok(Json(exp))
}
