use crate::{
    config::{config, Config},
    models::{AppErr, AppErrBadRequest},
};
use actix_web::web::Buf;
use lettre::{
    message::{MultiPart, SinglePart},
    Transport,
};
use rand::Rng;
use serde::Serialize;
use std::{fs::File, io};

pub fn now() -> i64 {
    chrono::Local::now().timestamp()
}

pub fn get_random_string(charset: &[u8], len: usize) -> String {
    let mut rng = rand::thread_rng();
    (0..len).map(|_| charset[rng.gen_range(0..charset.len())] as char).collect()
}

// pub fn get_random_bytes(len: usize) -> String {
//     let mut rng = rand::thread_rng();
//     hex::encode((0..len).map(|_| rng.gen::<u8>()).collect::<Vec<u8>>())
// }

pub async fn save_photo(url: &str, id: i64) -> Result<(), AppErr> {
    let client = awc::Client::new();
    let mut result = client.get(url).send().await?.body().await?.reader();
    let mut file = File::create(format!("{}/{id}.jpg", Config::RECORD_DIR))?;

    io::copy(&mut result, &mut file)?;

    Ok(())
}

pub async fn send_webhook(title: &str, desc: &str, color: u32) {
    let client = awc::Client::new();
    let request = client.post(&config().discord_webhook);

    #[derive(Serialize, Debug)]
    struct Embed {
        title: String,
        description: String,
        color: u32,
    }

    #[derive(Serialize, Debug)]
    struct Data {
        embeds: [Embed; 1],
    }

    let _ = request
        .send_json(&Data {
            embeds: [Embed {
                title: title.to_string(),
                description: desc.to_string(),
                color,
            }],
        })
        .await;
}

pub async fn send_code(email: &str, code: &str) -> Result<(), AppErr> {
    let html = format!(
        r##"<h1>Simurgh Verification</h1>
        <p>your verification code: <code style='font-size: 24px'>{code}</code></p>"##
    );
    let plain = format!("your verification code: {code}");

    let message = lettre::Message::builder()
        .from(config().mail_from.clone())
        .to(email
            .parse()
            .map_err(|_| AppErrBadRequest("could not parse to email"))?)
        .subject("Simurgh Verification")
        .date_now()
        .multipart(
            MultiPart::alternative()
                .singlepart(SinglePart::plain(plain))
                .singlepart(SinglePart::html(html)),
        )
        .map_err(|_| AppErr::new(500, "could not build the message"))?;

    config()
        .mail_server
        .send(&message)
        .map(|_| ())
        .map_err(|_| AppErr::new(500, "send email failed"))
}

pub trait CutOff {
    fn cut_off(&mut self, len: usize);
}

impl CutOff for String {
    fn cut_off(&mut self, len: usize) {
        let mut idx = len;
        loop {
            if self.is_char_boundary(idx) {
                break;
            }
            idx -= 1;
        }
        self.truncate(idx)
    }
}

impl CutOff for Option<String> {
    fn cut_off(&mut self, len: usize) {
        if let Some(v) = self {
            let mut idx = len;
            loop {
                if v.is_char_boundary(idx) {
                    break;
                }
                idx -= 1;
            }
            v.truncate(idx)
        }
    }
}
