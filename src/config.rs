use lettre::{message::Mailbox, SmtpTransport};
use std::sync::OnceLock;

#[derive(Debug)]
pub struct Config {
    pub mail_from: Mailbox,
    pub mail_server: SmtpTransport,
    pub heimdall_token: String,
}

impl Config {
    pub const RECORD_DIR: &'static str = "./record/";
    pub const TOKEN_ABC: &'static [u8] = b"!@#$%^&*_+abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*_+";
    pub const API_KEY_ABC: &'static [u8] =
        b"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_";
    pub const CODE_ABC: &'static [u8] = b"0123456789";
    pub const SLUG_ABC: &'static [u8] =
        b"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-";
}

macro_rules! evar {
    ($name:literal) => {
        std::env::var($name).expect(concat!($name, " was not found in env"))
    };
}

pub fn config() -> &'static Config {
    static STATE: OnceLock<Config> = OnceLock::new();
    let mail = evar!("GMAIL");
    let mail_server = SmtpTransport::relay("smtp.gmail.com")
        .expect("smpt relay failed")
        .port(465)
        .credentials((&mail, &evar!("GMAIL_PASS")).into())
        .build();

    STATE.get_or_init(|| Config {
        mail_from: mail.parse().expect("could not parse GMAIL"),
        mail_server,
        heimdall_token: evar!("HEIMDALL_TOKEN"),
    })
}
