use crate::{
    config::{config, Config},
    models::{AppErr, AppErrBadRequest},
};
use image::EncodableLayout;
use lettre::{
    message::{MultiPart, SinglePart},
    Transport,
};
use rand::Rng;
use serde::Serialize;
use std::io::{self, Read, Write};
use std::path::Path;

pub fn verify_slug(slug: &str) -> Result<(), AppErr> {
    if slug.len() < 3 {
        return Err(AppErrBadRequest(Some("حداقل طول نشانه 3 کاراکتر است")));
    }

    if !slug.chars().all(|c| Config::SLUG_ABC.contains(&(c as u8))) {
        return Err(AppErrBadRequest(Some(
            "نشانه شامل کاراکترهای نامعتبر است",
        )));
    }

    Ok(())
}

pub fn now() -> i64 {
    chrono::Local::now().timestamp()
}

pub fn get_random_string(charset: &[u8], len: usize) -> String {
    let mut rng = rand::thread_rng();
    (0..len).map(|_| charset[rng.gen_range(0..charset.len())] as char).collect()
}

pub fn get_random_bytes(len: usize) -> String {
    let mut rng = rand::thread_rng();
    hex::encode((0..len).map(|_| rng.gen::<u8>()).collect::<Vec<u8>>())
}

pub fn save_photo(
    path: &Path, name: &str, size: (u32, u32),
) -> Result<(), AppErr> {
    let img = image::ImageReader::open(path)?
        .with_guessed_format()?
        .decode()?
        .thumbnail(size.0, size.1);

    let img: image::DynamicImage = img.into_rgba8().into();

    let encoder = webp::Encoder::from_image(&img)?;
    let output = encoder.encode(60.0);
    let path = Path::new(Config::RECORD_DIR).join(name);
    std::fs::write(path, output.as_bytes())?;

    Ok(())
}

pub fn save_record(path: &Path, id: i64, salt: &str) -> io::Result<()> {
    let mut old_file = std::fs::File::open(path)?;
    let mut new_file = std::fs::File::create(
        Path::new(Config::RECORD_DIR).join(format!("r-{id}-{salt}")),
    )?;

    let mut buffer = [0u8; 4096];
    loop {
        let res = old_file.read(&mut buffer)?;
        if res == 0 {
            break;
        }
        new_file.write(&buffer[0..res])?;
    }

    Ok(())
}

pub fn remove_record(name: &str) {
    let _ = std::fs::remove_file(Path::new(Config::RECORD_DIR).join(name));
}

pub async fn heimdall_message(text: &str, tag: &str) {
    let client = awc::Client::new();
    let request = client
        .post(format!("https://heimdall.00-team.org/api/sites/messages/"))
        .insert_header(("authorization", config().heimdall_token.as_str()));

    #[derive(Serialize)]
    struct Message {
        text: String,
        tag: String,
    }

    let _ = request
        .send_json(&Message { text: text.to_string(), tag: tag.to_string() })
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
            .map_err(|_| AppErrBadRequest(Some("could not parse to email")))?)
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
        self.truncate(idx);
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
