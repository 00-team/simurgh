use std::{env, sync::OnceLock};

#[derive(Debug)]
pub struct Config {
    pub gmail: String,
    pub gmail_pass: String,
    pub discord_webhook: String,
}

impl Config {
    pub const RECORD_DIR: &'static str = "./record/";
    pub const TOKEN_ABC: &'static [u8] = b"!@#$%^&*_+abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*_+";
}

pub fn config() -> &'static Config {
    static STATE: OnceLock<Config> = OnceLock::new();
    STATE.get_or_init(|| {
        Config {
            gmail: env::var("GMAIL").unwrap(),
            gmail_pass: env::var("GMAIL_PASS").unwrap(),
            discord_webhook: env::var("DISCORD_WEBHOOK").unwrap(),
        }
    })
}
