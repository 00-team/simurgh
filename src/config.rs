use lettre::{message::Mailbox, SmtpTransport};
use std::{sync::OnceLock, time::Duration};

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
    let smtp_user = evar!("SMTP_USER");
    let mail_server = SmtpTransport::relay(&evar!("SMTP_HOST"))
        .expect("smpt relay failed")
        .port(465)
        .timeout(Some(Duration::from_secs(5)))
        .credentials((&smtp_user, &evar!("SMTP_PASS")).into())
        .build();

    STATE.get_or_init(|| Config {
        mail_from: smtp_user.parse().expect("could not parse GMAIL"),
        mail_server,
        heimdall_token: evar!("HEIMDALL_TOKEN"),
    })
}
