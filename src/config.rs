use std::{env, sync::OnceLock};

use lettre::{message::Mailbox, SmtpTransport};

#[derive(Debug)]
pub struct Config {
    pub mail_from: Mailbox,
    pub mail_server: SmtpTransport,
    pub discord_webhook: String,
}

impl Config {
    pub const RECORD_DIR: &'static str = "./record/";
    pub const TOKEN_ABC: &'static [u8] = b"!@#$%^&*_+abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*_+";
}

pub fn config() -> &'static Config {
    static STATE: OnceLock<Config> = OnceLock::new();
    let mail = env::var("GMAIL").expect("no GMAIL in env");
    let pass = env::var("GMAIL_PASS").expect("no GMAIL_PASS in env");
    let mail_server = SmtpTransport::relay("smtp.gmail.com")
        .expect("smpt relay failed")
        .port(465)
        .credentials((&mail, &pass).into())
        .build();

    STATE.get_or_init(|| Config {
        mail_from: mail.parse().expect("could not parse GMAIL"),
        mail_server,
        discord_webhook: env::var("DISCORD_WEBHOOK").unwrap(),
    })
}
