use actix_web::cookie::time::Duration;
use actix_web::cookie::{Cookie, SameSite};
use actix_web::web::{Data, Json};
use actix_web::{HttpResponse, Scope, get, patch, post};
use nest::utils::random_string;
use serde::Deserialize;
use utoipa::{OpenApi, ToSchema};

use crate::config::Config;
use crate::docs::UpdatePaths;
use crate::models::user::{User, VerificationAction};
use crate::models::{ClientIp, Horp, Jorp, Response};
use crate::state::{SimurghDb, Toll, VerificationState};
use crate::utils::CutOff;

#[derive(OpenApi)]
#[openapi(
    tags((name = "api::user")),
    paths(
        user_get, r_login, r_logout, user_update,
        // user_update_photo, user_delete_photo
    ),
    // components(schemas(User, UserUpdateBody, UserPhotoUpload)),
    servers((url = "/user")),
    modifiers(&UpdatePaths)
)]
pub struct ApiDoc;

fn auth_cookie(id: i64, token: &str) -> Cookie<'static> {
    Cookie::build("x-simurgh-auth-user", format!("{id}:{token}"))
        .path("/")
        .secure(!cfg!(debug_assertions))
        .same_site(SameSite::Lax)
        .http_only(true)
        .max_age(Duration::seconds(Config::TOKEN_LIFE as i64))
        .finish()
}

#[derive(serde::Serialize, serde::Deserialize, utoipa::ToSchema)]
pub struct LoginInfo {
    pub created: bool,
    pub user: User,
}

#[derive(Debug, serde::Serialize, serde::Deserialize, utoipa::ToSchema)]
pub struct LoginBody {
    pub phone: String,
    #[schema(example = "99999")]
    pub code: String,
}

#[utoipa::path(
    post,
    request_body = LoginBody,
    responses((status = 200, body = LoginInfo))
)]
/// Login
#[post("/login/")]
async fn r_login(
    ip: ClientIp,
    body: Json<LoginBody>,
    toll: Data<Toll>,
    vstate: Data<VerificationState>,
    db: Data<SimurghDb>, // ac: Data<AnalyticsCache>,
) -> Horp {
    toll.login_check(&ip).await?;

    let key = (body.phone.to_string(), VerificationAction::Login);
    vstate.verify(&key, &body.code).await?;

    let token = random_string(Config::TOKEN_ABC, 64);

    // let now = nest::sys_now() as i64;

    let result = sqlx::query_as! {
        User,
        "select * from users where phone = ?",
        body.phone
    }
    .fetch_one(&db.sql)
    .await;

    let (user, created) = match result {
        Ok(mut v) => {
            v.token = Some(token.clone());

            sqlx::query_as! {
                User,
                "update users set token = ? where id = ?",
                token, v.id
            }
            .execute(&db.sql)
            .await?;
            // let id = v.id;

            (v, false)
        }
        Err(_) => {
            let user = sqlx::query_as! {
                User,
                "insert into users (phone, token) values(?,?) returning *",
                body.phone, token
            }
            .fetch_one(&db.sql)
            .await?;

            (user, true)
        }
    };

    // Config::get().ms.update_user(&user).await;

    Ok(HttpResponse::Ok()
        .cookie(auth_cookie(user.id, &token))
        .json(LoginInfo { user, created }))
}

#[utoipa::path(post, responses((status = 200)))]
#[post("/logout/")]
/// Logout
async fn r_logout(_: User) -> HttpResponse {
    let cook = Cookie::build("x-simurgh-auth-user", "heech")
        .path("/")
        .secure(!cfg!(debug_assertions))
        .same_site(SameSite::Lax)
        .http_only(true)
        .max_age(Duration::seconds(1))
        .finish();

    HttpResponse::Ok().cookie(cook).finish()
}

#[utoipa::path(get, responses((status = 200, body = User)))]
/// Get
#[get("/")]
async fn user_get(user: User) -> Response<User> {
    Ok(Json(user))
}

#[derive(Deserialize, ToSchema)]
struct UserUpdateBody {
    name: String,
}

#[utoipa::path(
    patch,
    request_body = UserUpdateBody,
    responses((status = 200, body = User))
)]
/// Update
#[patch("/")]
async fn user_update(
    user: User, mut body: Json<UserUpdateBody>, db: Data<SimurghDb>,
) -> Jorp<User> {
    body.name.cut_off(256);

    let user = sqlx::query_as! {
        User,
        "update users set name = ? where id = ? returning *",
        body.name, user.id
    }
    .fetch_one(&db.sql)
    .await?;

    Ok(Json(user))
}

// #[derive(Debug, MultipartForm, ToSchema)]
// pub struct UserPhotoUpload {
//     #[schema(value_type = String, format = Binary)]
//     #[multipart(limit = "8 MiB")]
//     pub photo: TempFile,
// }

// #[utoipa::path(
//     put,
//     request_body(content = UserPhotoUpload, content_type = "multipart/form-data"),
//     responses((status = 200, body = User))
// )]
// /// Update Photo
// #[put("/photo/")]
// async fn user_update_photo(
//     user: User, form: MultipartForm<UserPhotoUpload>, db: Data<SimurghDb>,
// ) -> Jorp<User> {
//     let mut user = user;
//
//     let salt = if let Some(p) = &user.photo {
//         p.clone()
//     } else {
//         let s = utils::get_random_bytes(8);
//         user.photo = Some(s.clone());
//         s
//     };
//
//     utils::save_photo(
//         form.photo.file.path(),
//         &format!("up-{}-{salt}", user.id),
//         (512, 512),
//     )?;
//
//     sqlx::query_as! {
//         User,
//         "update users set photo = ? where id = ?",
//         user.photo, user.id
//     }
//     .execute(&db.sql)
//     .await?;
//
//     Ok(Json(user))
// }

// #[utoipa::path(delete, responses((status = 200)))]
// /// Delete Photo
// #[delete("/photo/")]
// async fn user_delete_photo(user: User, db: Data<SimurghDb>) -> HttpResponse {
//     let mut user = user;
//
//     if user.photo.is_none() {
//         return HttpResponse::Ok().finish();
//     }
//
//     utils::remove_record(&format!("up-{}-{}", user.id, user.photo.unwrap()));
//     user.photo = None;
//
//     let _ = sqlx::query_as! {
//         User,
//         "update users set photo = ? where id = ?",
//         user.photo, user.id
//     }
//     .execute(&db.sql)
//     .await;
//
//     HttpResponse::Ok().finish()
// }

pub fn router() -> Scope {
    Scope::new("/user")
        .service(user_get)
        .service(r_login)
        .service(r_logout)
        .service(user_update)
    // .service(user_update_photo)
    // .service(user_delete_photo)
}
