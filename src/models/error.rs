use std::{
    fmt,
    num::{ParseFloatError, ParseIntError},
    string::FromUtf8Error,
};

use actix_web::{
    body::BoxBody, error::PayloadError, http::StatusCode, HttpResponse,
    ResponseError,
};
use awc::error::{JsonPayloadError, SendRequestError};
use serde::Serialize;
use tokio::io;
use utoipa::ToSchema;

#[derive(Clone, Serialize, Debug, ToSchema)]
pub struct AppErr {
    status: u16,
    message: String,
}

impl AppErr {
    pub fn new(status: u16, message: &str) -> Self {
        Self { status, message: message.to_string() }
    }

    // pub fn default() -> Self {
    //     Self { status: 500, message: "Internal Server Error".to_string() }
    // }
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
        HttpResponse::build(self.status_code()).json(self)
    }
}

impl From<sqlx::Error> for AppErr {
    fn from(value: sqlx::Error) -> Self {
        match value {
            sqlx::Error::RowNotFound => {
                Self { status: 404, message: "not found".to_string() }
            }
            _ => Self { status: 500, message: "database error".to_string() },
        }
    }
}

impl From<actix_web::error::Error> for AppErr {
    fn from(value: actix_web::error::Error) -> Self {
        let r = value.error_response();
        Self { status: r.status().as_u16(), message: value.to_string() }
    }
}

macro_rules! impl_from_err {
    ($ty:path) => {
        impl From<$ty> for AppErr {
            fn from(value: $ty) -> Self {
                let value = value.to_string();
                log::error!("err 500: {}", value);
                Self { status: 500, message: value }
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

macro_rules! error_helper {
    ($name:ident, $status:ident) => {
        #[doc = concat!("Helper function that wraps any error and generates a `", stringify!($status), "` response.")]
        #[allow(non_snake_case)]
        pub fn $name(err: &str) -> AppErr {
            log::error!("err {} - {}", stringify!($status), err);
            AppErr {
                status: StatusCode::$status.as_u16(),
                message: err.to_string()
            }
        }
    };
}

error_helper!(AppErrBadRequest, BAD_REQUEST);
error_helper!(AppErrForbidden, FORBIDDEN);
