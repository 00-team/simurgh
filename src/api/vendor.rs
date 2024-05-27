use std::collections::HashMap;

use actix_web::web::{Data, Json, Path, Query};
use actix_web::{get, post, HttpResponse, Scope};
use serde::Deserialize;
use serde_json::Value;
use utoipa::{IntoParams, OpenApi, ToSchema};

use crate::config::{config, Config};
use crate::docs::UpdatePaths;
use crate::general::{general_get, general_set, PriceValue};
use crate::models::order::Order;
use crate::models::user::User;
use crate::models::{AppErr, AppErrBadRequest, AppErrForbidden, Response};
use crate::utils::send_message;
use crate::vendor::{self, rub_irr_price};
use crate::{utils, AppState};

#[derive(OpenApi)]
#[openapi(
    tags((name = "api::vendor")),
    paths(prices, sms_callback, vendor_buy),
    components(schemas(SmsData)),
    servers((url = "/vendor")),
    modifiers(&UpdatePaths)
)]
pub struct ApiDoc;

type Prices = HashMap<String, (i64, i64)>;

#[utoipa::path(get, responses((status = 200)))]
/// Prices
#[get("/prices/")]
async fn prices(_: User, state: Data<AppState>) -> Response<Prices> {
    let now = utils::now();
    let mut general = general_get(&state.sql).await?;
    let mut update_general = false;

    if general.rub_irr_update + 86400 < now {
        update_general = true;
        general.rub_irr_update = now;
        general.rub_irr = rub_irr_price().await?;
    }

    if general.prices_update + 600 < now {
        update_general = true;
        general.prices_update = now;

        let avg_diff =
            if general.price_diff_count != 0 && general.price_diff_total != 0 {
                (general.price_diff_total / general.price_diff_count) as f64
            } else {
                10.0
            };

        let result = vendor::request("getPrices", vec![]).await?;

        result.as_object().expect("result is not an object").iter().for_each(
            |(country, v)| {
                v.as_object().expect("invalid response L1").iter().for_each(
                    |(service, vv)| {
                        let vv = vv.as_object().expect("invalid response L2");
                        let count = vv.get("count").expect("count not found");
                        let count = count.as_i64().expect("count is NaN");
                        let cost = vv.get("cost").expect("cost not found");
                        let cost = cost.as_f64().expect("cost is NaN") + avg_diff;

                        if count == 0 {
                            return;
                        }

                        let key = format!("{country}-{service}");
                        if let Some(p) = general.prices.get_mut(&key) {
                            p.count = count;
                            p.cost_api = cost;
                        } else {
                            general.prices.insert(
                                key,
                                PriceValue {
                                    cost_api: cost,
                                    count,
                                    ..Default::default()
                                },
                            );
                        }
                    },
                );
            },
        );
    }

    if update_general {
        general_set(&state.sql, &general).await?;
    }

    let prices: Prices = general
        .prices
        .iter()
        .map(|(k, v)| {
            let cost = if v.cost_buy > 0.0 && v.timestamp + 864000 > now {
                v.cost_buy
            } else {
                v.cost_api
            };

            let p = cost * general.rub_irr as f64 * Config::TAX;
            let p = ((p / 1e4).ceil() * 1e4).max(15e4) as i64;
            (k.clone(), (p, v.count))
        })
        .collect();

    Ok(Json(prices))
}

#[derive(Deserialize, ToSchema, Debug)]
#[serde(rename_all = "camelCase")]
struct SmsData {
    activation_id: i64,
    service: String,
    text: String,
    code: String,
    country: i64,
    received_at: String,
}

#[utoipa::path(
    post,
    params(("pass" = String, Path,)),
    request_body = SmsData,
    responses((status = 200))
)]
/// Sms Callback
#[post("/sms-callback/{pass}/")]
async fn sms_callback(
    data: Json<Value>, path: Path<(String,)>, state: Data<AppState>,
) -> Result<HttpResponse, AppErr> {
    if path.0 != config().sms_cb_pass {
        return Err(AppErrForbidden("invalid pass"));
    }
    log::info!("sms cb: {:#?}", data);
    let now = utils::now();
    let data = serde_json::from_value::<SmsData>(data.0)?;
    log::info!("sms cb 2: {:#?}", data);

    let order = sqlx::query_as! {
        Order,
        "select * from orders where activation_id = ?",
        data.activation_id
    }
    .fetch_one(&state.sql)
    .await;

    if order.is_err() {
        return Ok(HttpResponse::Ok().finish());
    }
    let order = order.unwrap();

    send_message(order.user, &data.text).await;

    sqlx::query! {
        "insert into messages(user, activation_id, timestamp, text, code,
         country, service, received_at) values(?,?,?,?,?,?,?,?)",
        order.user, data.activation_id, now, data.text, data.code,
        data.country, data.service, data.received_at
    }
    .execute(&state.sql)
    .await?;

    let desc = format! {
        "id: {}\nservice: {}\ntext: `{}`\ncode: `{}`\ncountry: {}\nreceivedAt: {}",
        data.activation_id, data.service, data.text, data.code, data.country, data.received_at
    };

    utils::send_webhook("Sms", &desc, 13868854).await;
    Ok(HttpResponse::Ok().finish())
}

#[derive(Deserialize, IntoParams)]
struct BuyQuery {
    country: String,
    service: String,
}

#[utoipa::path(
    post,
    params(BuyQuery),
    responses((status = 200, body = String))
)]
/// Buy Number
#[post("/buy/")]
async fn vendor_buy(
    user: User, q: Query<BuyQuery>, state: Data<AppState>,
) -> Response<String> {
    #[derive(Deserialize, Debug)]
    #[serde(rename_all = "camelCase")]
    struct Answer {
        activation_id: String,
        phone_number: String,
        activation_cost: String,
        activation_time: String,
        activation_operator: String,
    }

    let now = utils::now();
    let key = format!("{}-{}", q.country, q.service);
    let mut general = general_get(&state.sql).await?;
    let price = general.prices.get_mut(&key);
    if price.is_none() {
        return Err(AppErrBadRequest("not found"));
    }
    let price = price.unwrap();

    if general.rub_irr_update + 86400 < now {
        general.rub_irr_update = now;
        general.rub_irr = rub_irr_price().await?;
    }

    let cost_rub = if price.cost_buy > 0.0 && price.timestamp + 864000 > now {
        price.cost_buy
    } else {
        price.cost_api
    };
    let cost_irr = cost_rub * general.rub_irr as f64 * Config::TAX;
    let cost_irr = ((cost_irr / 1e4).ceil() * 1e4).max(15e4) as i64;

    if user.wallet < cost_irr {
        return Err(AppErrBadRequest("not enough in the wallet"));
    }

    let wallet = user.wallet - cost_irr;
    sqlx::query! {
        "update users set wallet = ? where id = ?",
        wallet, user.id
    }
    .execute(&state.sql)
    .await?;

    let args = vec![
        ("service", q.service.as_str()),
        ("country", q.country.as_str()),
        // ("forward", "$forward"),
        // ("operator", "$operator"),
        // ("ref", "$ref"),
        // ("phoneException", "$phoneException"),
        // ("maxPrice", "1"),
        // ("verification", "$verification"),
    ];
    let result = vendor::request("getNumberV2", args).await?;
    log::info!("result: {:#?}", result);
    let result = serde_json::from_value::<Answer>(result)?;
    let new_cost_rub: f64 = result.activation_cost.parse()?;

    let new_cost_irr = new_cost_rub * general.rub_irr as f64;
    let profit = cost_irr - new_cost_irr as i64;

    if profit < 0 {
        general.money_loss += profit * -1;
    } else {
        general.money_gain += profit;
    }

    price.cost_buy = new_cost_rub;
    price.timestamp = now;

    general_set(&state.sql, &general).await?;

    log::info!("{:#?}", result);

    sqlx::query! {
        "insert into orders(user, activation_id, phone,
        cost, country, operator, datetime, service)
        values(?,?,?,?,?,?,?,?)",
        user.id, result.activation_id, result.phone_number, cost_irr, q.country,
        result.activation_operator, result.activation_time, q.service
    }
    .execute(&state.sql)
    .await?;

    Ok(Json("ok".to_string()))
}

pub fn router() -> Scope {
    Scope::new("/vendor")
        .service(prices)
        .service(sms_callback)
        .service(vendor_buy)
}
