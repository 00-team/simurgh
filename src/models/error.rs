use std::{
    fmt,
    num::{ParseFloatError, ParseIntError},
    string::FromUtf8Error,
};

use actix_web::{
    body::BoxBody,
    error::PayloadError,
    http::{header::ToStrError, StatusCode},
    HttpResponse, ResponseError,
};
use awc::error::{JsonPayloadError, SendRequestError};
use serde::Serialize;
use tokio::io;
use utoipa::ToSchema;

#[derive(Clone, Serialize, Debug, ToSchema)]
pub struct AppErr {
    status: u16,
    subject: String,
    content: Option<String>,
}

impl AppErr {
    pub fn new(status: u16, subject: &str) -> Self {
        Self { status, subject: subject.to_string(), content: None }
    }

    pub fn default() -> Self {
        Self {
            status: 500, subject: "خطای سیستمی".to_string(), content: None
        }
    }
}

impl fmt::Display for AppErr {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{:?}", self)
    }
}

impl ResponseError for AppErr {
    fn status_code(&self) -> StatusCode {
        StatusCode::from_u16(self.status)
            .unwrap_or(StatusCode::INTERNAL_SERVER_ERROR)
    }

    fn error_response(&self) -> HttpResponse<BoxBody> {
        if self.status == 500 {
            log::error!("AppErr: {} - {:?}", self.subject, self.content);
        }
        HttpResponse::build(self.status_code()).json(self)
    }
}

impl From<sqlx::Error> for AppErr {
    fn from(value: sqlx::Error) -> Self {
        match value {
            sqlx::Error::RowNotFound => Self {
                status: 404,
                subject: "یافت نشد".to_string(),
                content: None,
            },
            sqlx::Error::Database(e) => {
                let code = e.code();
                if code.is_none() {
                    log::error!("sqlx db error: {e:#?}");
                    return Self::default();
                }
                let code = code.unwrap().to_string();
                match code.as_str() {
                    "2067" | "1555" => Self {
                        status: 400,
                        subject: "مورد مشابهی پیدا شد".to_string(),
                        content: None,
                    },
                    _ => {
                        log::error!("sqlx db error: {e:#?}");
                        Self::default()
                    }
                }
            }
            _ => {
                log::error!("sqlx error: {value:#?}");
                Self::default()
            }
        }
    }
}

impl From<actix_web::error::Error> for AppErr {
    fn from(value: actix_web::error::Error) -> Self {
        let r = value.error_response();
        Self {
            status: r.status().as_u16(),
            subject: "خطا".to_string(),
            content: Some(value.to_string()),
        }
    }
}

macro_rules! impl_from_err {
    ($ty:path) => {
        impl From<$ty> for AppErr {
            fn from(value: $ty) -> Self {
                let value = value.to_string();
                Self {
                    status: 500,
                    subject: stringify!($ty).to_string(),
                    content: Some(value),
                }
            }
        }
    };
}

impl_from_err!(io::Error);
impl_from_err!(PayloadError);
impl_from_err!(ParseFloatError);
impl_from_err!(ParseIntError);
impl_from_err!(JsonPayloadError);
impl_from_err!(SendRequestError);
impl_from_err!(FromUtf8Error);
impl_from_err!(serde_json::Error);
impl_from_err!(tempfile::PersistError);
impl_from_err!(ToStrError);

macro_rules! error_helper {
    ($name:ident, $status:ident, $subject:literal) => {
        #[doc = concat!("Helper function that wraps any error and generates a `", stringify!($status), "` response.")]
        #[allow(non_snake_case)]
        #[inline]
        pub fn $name(err: Option<&str>) -> AppErr {
            AppErr {
                status: StatusCode::$status.as_u16(),
                subject: $subject.to_string(),
                content: err.map(|s| s.to_string())
            }
        }
    };
}

error_helper!(AppErrBadRequest, BAD_REQUEST, "درخواست بد");
error_helper!(AppErrNotFound, NOT_FOUND, "پیدا نشد");
error_helper!(AppErrForbidden, FORBIDDEN, "ممنوع");
error_helper!(AppErrBadAuth, FORBIDDEN, "احراز هویت نامعتبر");
