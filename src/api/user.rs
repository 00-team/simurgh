use actix_multipart::form::tempfile::TempFile;
use actix_multipart::form::MultipartForm;
use actix_web::cookie::time::Duration;
use actix_web::cookie::{Cookie, SameSite};
use actix_web::web::{Data, Json};
use actix_web::{
    delete, get, patch, post, put, FromRequest, HttpRequest, HttpResponse,
    Scope,
};
use serde::Deserialize;
use sha2::{Digest, Sha512};
use utoipa::{OpenApi, ToSchema};

use crate::api::verification;
use crate::config::Config;
use crate::docs::UpdatePaths;
use crate::models::user::User;
use crate::models::{AppErr, AppErrBadRequest, Response};
use crate::utils::CutOff;
use crate::{utils, AppState};

#[derive(OpenApi)]
#[openapi(
    tags((name = "api::user")),
    paths(
        user_get, user_login, user_update,
        user_update_photo, user_delete_photo
    ),
    components(schemas(User, LoginBody, UserUpdateBody, UserPhotoUpload)),
    servers((url = "/user")),
    modifiers(&UpdatePaths)
)]
pub struct ApiDoc;

#[derive(Debug, Deserialize, ToSchema)]
struct LoginBody {
    email: String,
    code: String,
}

#[utoipa::path(
    post,
    request_body = LoginBody,
    responses((status = 200, body = User))
)]
/// Login
#[post("/login/")]
async fn user_login(
    body: Json<LoginBody>, state: Data<AppState>,
) -> Result<HttpResponse, AppErr> {
    verification::verify(&body.email, &body.code, verification::Action::Login)
        .await?;

    let token = utils::get_random_string(Config::TOKEN_ABC, 69);
    let token_hashed = hex::encode(Sha512::digest(&token));

    let result = sqlx::query_as! {
        User,
        "select * from users where email = ?",
        body.email
    }
    .fetch_one(&state.sql)
    .await;

    let mut user: User = match result {
        Ok(mut v) => {
            v.token = token;

            let _ = sqlx::query_as! {
                User,
                "update users set token = ? where id = ?",
                token_hashed, v.id
            }
            .execute(&state.sql)
            .await;

            v
        }
        Err(_) => {
            let result = sqlx::query_as! {
                User,
                "insert into users (email, token) values(?, ?)",
                body.email, token_hashed
            }
            .execute(&state.sql)
            .await;

            User {
                email: body.email.clone(),
                token,
                id: result.unwrap().last_insert_rowid(),
                ..Default::default()
            }
        }
    };

    user.token = format!("{}:{}", user.id, user.token);

    let cook = Cookie::build("Authorization", format!("Bearer {}", user.token))
        .path("/")
        .secure(true)
        .same_site(SameSite::Strict)
        .http_only(true)
        .max_age(Duration::weeks(12))
        .finish();

    Ok(HttpResponse::Ok().cookie(cook).json(user))
}

#[utoipa::path(get, responses((status = 200, body = User)))]
/// Get
#[get("/")]
async fn user_get(user: User) -> Response<User> {
    Ok(Json(user))
}

#[derive(Deserialize, ToSchema)]
struct UserUpdateBody {
    name: Option<String>,
}

#[utoipa::path(
    patch,
    request_body = UserUpdateBody,
    responses(
        (status = 200, body = User)
    )
)]
/// Update
#[patch("/")]
async fn user_update(
    user: User, body: Json<UserUpdateBody>, state: Data<AppState>,
) -> Json<User> {
    let mut user = user;
    let mut change = false;
    if let Some(n) = &body.name {
        change = true;
        user.name = Some(n.clone());
    };

    if change {
        user.name.cut_off(256);

        let _ = sqlx::query_as! {
            User,
            "update users set name = ? where id = ?",
            user.name, user.id
        }
        .execute(&state.sql)
        .await;
    }

    Json(user)
}

#[derive(Debug, MultipartForm, ToSchema)]
pub struct UserPhotoUpload {
    #[schema(value_type = String, format = Binary)]
    #[multipart(limit = "8 MiB")]
    pub photo: TempFile,
}

#[utoipa::path(
    put,
    request_body(content = UserPhotoUpload, content_type = "multipart/form-data"),
    responses((status = 200, body = User))
)]
/// Update Photo
#[put("/photo/")]
async fn user_update_photo(
    req: HttpRequest, user: User, state: Data<AppState>,
) -> Response<User> {
    let form =
        MultipartForm::<UserPhotoUpload>::extract(&req).await.map_err(|e| {
            log::error!("err: {e:#?}");
            AppErrBadRequest(&e.to_string())
        })?;
    let mut user = user;

    let salt = if let Some(p) = &user.photo {
        p.clone()
    } else {
        let s = utils::get_random_bytes(8);
        user.photo = Some(s.clone());
        s
    };

    utils::save_photo(
        form.photo.file.path(),
        &format!("up-{}-{salt}", user.id),
        (512, 512),
    )?;

    sqlx::query_as! {
        User,
        "update users set photo = ? where id = ?",
        user.photo, user.id
    }
    .execute(&state.sql)
    .await?;

    Ok(Json(user))
}

#[utoipa::path(delete, responses((status = 200)))]
/// Delete Photo
#[delete("/photo/")]
async fn user_delete_photo(user: User, state: Data<AppState>) -> HttpResponse {
    let mut user = user;

    if user.photo.is_none() {
        return HttpResponse::Ok().finish();
    }

    utils::remove_record(&format!("up-{}-{}", user.id, user.photo.unwrap()));
    user.photo = None;

    let _ = sqlx::query_as! {
        User,
        "update users set photo = ? where id = ?",
        user.photo, user.id
    }
    .execute(&state.sql)
    .await;

    HttpResponse::Ok().finish()
}

pub fn router() -> Scope {
    Scope::new("/user")
        .service(user_get)
        .service(user_login)
        .service(user_update)
        .service(user_update_photo)
        .service(user_delete_photo)
}
