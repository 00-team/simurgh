// use lettre::{message::Mailbox, SmtpTransport};
use media::MediaConfig;
use std::{sync::OnceLock, time::Duration};

#[derive(Debug)]
/// `Simurgh` Config
pub struct Config {
    // pub mail_from: Mailbox,
    // pub mail_server: SmtpTransport,
    // pub heimdall_token: String,
    pub melipayamak_url: reqwest::Url,
    pub smsc: reqwest::Client,
}

impl Config {
    /// 180 days
    pub const TOKEN_LIFE: u64 = 180 * 24 * 3600;

    pub const API_VERSION: &str = "0.1.0";
    pub const PORT: u16 = 7700;
    // pub const RECORD_DIR: &'static str = "./record/";
    pub const TOKEN_ABC: &[u8] = b"!@#$%^&*_+abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*_+";
    pub const API_KEY_ABC: &[u8] =
        b"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_";
    pub const CODE_ABC: &[u8] = b"0123456789";
    pub const SLUG_ABC: &[u8] =
        b"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-";

    pub fn create_dirs() -> std::io::Result<()> {
        MediaConfig::create_dirs()?;

        Ok(())
    }

    fn init() -> Self {
        let ct = tom::get();
        Self {
            // melipayamak: ct.melipayamak,
            melipayamak_url: reqwest::Url::parse(&format!(
                "https://console.melipayamak.com/api/send/shared/{}",
                ct.melipayamak
            ))
            .unwrap(),
            smsc: reqwest::ClientBuilder::new()
                .timeout(Duration::from_secs(10))
                .connection_verbose(false)
                .build()
                .unwrap(),
        }
    }

    pub fn get() -> &'static Config {
        static STATE: OnceLock<Config> = OnceLock::new();
        STATE.get_or_init(Self::init)
    }
}

mod tom {

    #[derive(Debug, serde::Deserialize)]
    pub struct ConfigToml {
        pub melipayamak: String,
    }

    pub fn get() -> ConfigToml {
        log::info!("reading toml config at: env.toml");
        let data = match std::fs::read_to_string("env.toml") {
            Ok(v) => v,
            Err(e) => panic!("could not read config at: env.toml\n{e:#?}"),
        };

        match toml::from_str(&data) {
            Ok(v) => v,
            Err(e) => panic!("invalid toml config file: env.toml\n{e}"),
        }
    }
}
