use actix_web::cookie::time::Duration;
use actix_web::cookie::{Cookie, SameSite};
use actix_web::web::{Data, Json, Path, Query};
use actix_web::{get, post, HttpResponse, Scope};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha512};
use utoipa::{IntoParams, OpenApi, ToSchema};

use crate::config::{config, Config};
use crate::docs::UpdatePaths;
// use crate::models::message::Message;
// use crate::models::order::Order;
// use crate::models::transaction::{Transaction, TransactionStatus};
use crate::api::verification;
use crate::models::user::User;
use crate::models::{AppErr, AppErrBadRequest, ListInput, Response};
use crate::{utils, AppState};

#[derive(OpenApi)]
#[openapi(
    tags((name = "api::user")),
    paths(
        user_get, user_login,
        // user_deposit, user_transactions, user_orders,
        // user_messages, user_message_seen, user_messages_unseen_count,
    ),
    components(schemas()),
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
//
// #[utoipa::path(
//     get,
//     params(("amount" = u64, Path, example = 1e4)),
//     responses((status = 200, body = String))
// )]
// /// Deposit
// #[get("/deposit/{amount}/")]
// async fn user_deposit(
//     user: User, path: Path<(i64,)>, state: Data<AppState>,
// ) -> Response<String> {
//     let allowed = 50_000_000 - user.wallet;
//     if allowed < 50_000 {
//         return Err(AppErrBadRequest("wallet is maxed out"));
//     }
//
//     let amount = path.0.max(50_000).min(allowed);
//     let now = utils::now();
//
//
//
//     #[derive(Serialize)]
//     struct Data {
//         merchant_id: String,
//         amount: i64,
//         description: String,
//         callback_url: String,
//     }
//
//     let client = awc::Client::new();
//     let mut result = client
//         .post("https://api.zarinpal.com/pg/v4/payment/request.json")
//         .send_json(&Data {
//             merchant_id: config().zarinpal.clone(),
//             amount,
//             description: format!("{}", user.name),
//             callback_url: "http://localhost:7200/api/user/zcb/".to_string()
//         })
//         .await?;
//
//     log::info!("result: {}", result.status());
//     log::info!("result: {:?}", result.body().await?);
//
//     // TODO: insert into transactions
//     // sqlx::query! {
//     //     "insert into transactions(user, amount, timestamp, authority) values(?,?,?,?)",
//     //     user.id, amount, now, result.authority
//     // }
//     // .execute(&state.sql)
//     // .await?;
//
//     // sqlx::query! {
//     //     "update users set wallet = ? where id = ?",
//     //     wallet, user.id
//     // }
//     // .execute(&state.sql)
//     // .await?;
//     //
//     // sqlx::query! {
//     //     "update transactions set status = ? where id = ?",
//     //     TransactionStatus::Success, tid
//     // }
//     // .execute(&state.sql)
//     // .await?;
//
//     Ok(Json(format!("amount is {amount}")))
// }
//
// #[utoipa::path(
//     get,
//     params(ListInput),
//     responses((status = 200, body = Vec<Transaction>))
// )]
// /// List Transactions
// #[get("/transactions/")]
// async fn user_transactions(
//     user: User, q: Query<ListInput>, state: Data<AppState>,
// ) -> Response<Vec<Transaction>> {
//     let offset = q.page * 32;
//     let result = sqlx::query_as! {
//         Transaction,
//         "select * from transactions where user = ?
//          order by id desc limit 32 offset ?",
//         user.id, offset
//     }
//     .fetch_all(&state.sql)
//     .await?;
//
//     Ok(Json(result))
// }
//
// #[utoipa::path(
//     get,
//     params(ListInput),
//     responses((status = 200, body = Vec<Message>))
// )]
// /// List Messages
// #[get("/messages/")]
// async fn user_messages(
//     user: User, q: Query<ListInput>, state: Data<AppState>,
// ) -> Response<Vec<Message>> {
//     let offset = q.page * 32;
//     let result = sqlx::query_as! {
//         Message,
//         "select * from messages where user = ? order by id desc limit 32 offset ?",
//         user.id, offset
//     }
//     .fetch_all(&state.sql)
//     .await?;
//
//     Ok(Json(result))
// }
//
// #[utoipa::path(
//     post,
//     params(("id" = i64, Path,)),
//     responses((status = 200))
// )]
// /// Message Seen
// #[post("/messages/{id}/seen/")]
// async fn user_message_seen(
//     user: User, message: Message, state: Data<AppState>,
// ) -> Result<HttpResponse, AppErr> {
//     sqlx::query! {
//         "update messages set seen = true where id = ? and user = ?",
//         message.id, user.id
//     }
//     .execute(&state.sql)
//     .await?;
//
//     Ok(HttpResponse::Ok().finish())
// }
//
// #[utoipa::path(
//     get,
//     responses((status = 200, body = i32))
// )]
// /// Messages UnSeen Count
// #[get("/messages-unseen-count/")]
// async fn user_messages_unseen_count(
//     user: User, state: Data<AppState>,
// ) -> Response<i32> {
//     let result = sqlx::query! {
//         "select count(id) as count from messages where user = ? and seen = false
//         order by id desc limit 10",
//         user.id
//     }
//     .fetch_one(&state.sql)
//     .await?;
//
//     Ok(Json(result.count))
// }
//
// #[utoipa::path(
//     get,
//     params(ListInput),
//     responses((status = 200, body = Vec<Order>))
// )]
// /// List Orders
// #[get("/orders/")]
// async fn user_orders(
//     user: User, q: Query<ListInput>, state: Data<AppState>,
// ) -> Response<Vec<Order>> {
//     let offset = q.page * 32;
//     let result = sqlx::query_as! {
//         Order,
//         "select * from orders where user = ? order by id desc limit 32 offset ?",
//         user.id, offset
//     }
//     .fetch_all(&state.sql)
//     .await?;
//
//     Ok(Json(result))
// }

pub fn router() -> Scope {
    Scope::new("/user").service(user_get).service(user_login)
}
