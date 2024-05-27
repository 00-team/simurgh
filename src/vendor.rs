use std::{collections::HashMap, env, str::FromStr};

use lazy_static::lazy_static;
use serde_json::{json, Number, Value};

use crate::{config::config, models::AppErr};

lazy_static! {
    static ref BASE_URL: String = {
        format!(
            "https://api.sms-activate.org/stubs/handler_api.php?api_key={}",
            env::var("VENDOR_APIKEY").unwrap()
        )
    };
    static ref ERRORS: HashMap<&'static str, Option<AppErr>> = {
        HashMap::from([
            ("NO_NUMBERS", Some(AppErr::new(404, "no number was found"))),
            ("NO_BALANCE", None),
            ("BAD_ACTION", None),
            ("BAD_SERVICE", None),
            ("BAD_KEY", None),
            ("ERROR_SQL", None),
            ("SQL_ERROR", None),
            ("NO_ACTIVATION", None),
            ("BAD_STATUS", None),
            ("STATUS_CANCEL", None),
            ("BANNED", None),
            ("NO_CONNECTION", None),
            ("ACCOUNT_INACTIVE", None),
            ("NO_ID_RENT", None),
            ("INVALID_PHONE", None),
            ("STATUS_FINISH", None),
            ("INCORECT_STATUS", None),
            ("CANT_CANCEL", None),
            ("ALREADY_FINISH", None),
            ("ALREADY_CANCEL", None),
            ("WRONG_OPERATOR", None),
            ("NO_YULA_MAIL", None),
            ("WHATSAPP_NOT_AVAILABLE", None),
            ("NOT_INCOMING", None),
            ("INVALID_ACTIVATION_ID", None),
            ("WRONG_ADDITIONAL_SERVICE", None),
            ("WRONG_ACTIVATION_ID", None),
            ("WRONG_SECURITY", None),
            ("REPEAT_ADDITIONAL_SERVICE", None),
            ("NO_KEY", None),
            ("OPERATORS_NOT_FOUND", None),
        ])
    };
}

pub async fn request(
    action: &'static str, args: Vec<(&'static str, &str)>,
) -> Result<Value, AppErr> {
    let p = args.iter().map(|(a, b)| format!("&{a}={b}")).collect::<String>();
    let url = format!("{}&action={}{}", *BASE_URL, action, p);

    let response = String::from_utf8(
        awc::Client::new().get(url).send().await?.body().await?.to_vec(),
    )?;

    if response.len() <= 25 {
        if let Some(err) = ERRORS.get(response.as_str()) {
            log::error!("response: {response}");
            if let Some(app_err) = err {
                return Err(app_err.clone());
            }

            return Err(AppErr::new(500, "service not available"));
        }
    }

    match action {
        "getBalance" | "getBalanceAndCashBack" => {
            Ok(Value::Number(Number::from_str(response.split_at(15).1)?))
        }
        "getNumber" => {
            let mut result = response.split_at(14).1.splitn(2, ':');
            let id = Number::from_str(result.next().unwrap())?;
            let phone = Number::from_str(result.next().unwrap())?;
            Ok(json!({ "id": id, "phone": phone }))
        }
        "getAdditionalService" => {
            let mut result = response.split_at(11).1.splitn(2, ':');
            let id = Number::from_str(result.next().unwrap())?;
            let phone = Number::from_str(result.next().unwrap())?;
            Ok(json!({ "id": id, "phone": phone }))
        }
        _ => Ok(serde_json::from_str::<Value>(&response)?),
    }
}

pub async fn rub_irr_price() -> Result<i64, AppErr> {
    if cfg!(debug_assertions) {
        return Ok(6710);
    }

    let result = awc::Client::new().get(format!(
        "http://api.navasan.tech/latest/?item=rub&api_key={}",
        config().navasan_apikey
    ));
    let result = result.send().await?.json::<Value>().await?;

    let result = result.as_object().unwrap().get("rub").unwrap().as_object();
    let result = result.unwrap().get("value").unwrap().as_str().unwrap();
    Ok(result.parse::<i64>()? * 10)
}
