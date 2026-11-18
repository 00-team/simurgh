use actix_web::{HttpResponse, ResponseError, body::BoxBody, http::StatusCode};
use nest::{NestError, NestErrorContext};

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize, utoipa::ToSchema)]
pub struct AppErr {
    pub status: u16,
    pub code: NestError,
    pub debug: Option<String>,
}

impl AppErr {
    pub fn server_error() -> Self {
        Self { status: 500, code: NestError::ServerError, debug: None }
    }

    pub fn debug(mut self, debug: &str) -> Self {
        self.debug = Some(debug.to_string());
        self
    }
}

impl From<NestError> for AppErr {
    fn from(value: NestError) -> Self {
        Self { status: value.status(), code: value, debug: None }
    }
}

impl From<NestErrorContext> for AppErr {
    fn from(value: NestErrorContext) -> Self {
        Self { status: value.status, code: value.code, debug: value.debug }
    }
}

impl std::error::Error for AppErr {}

impl std::fmt::Display for AppErr {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
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

impl From<actix_web::http::header::ToStrError> for AppErr {
    fn from(value: actix_web::http::header::ToStrError) -> Self {
        // use actix_web::http::header::ToStrError
        Self {
            status: 400,
            code: NestError::BadRequest,
            debug: Some(format!(
                "could not convert this header value to string: {value:?}"
            )),
        }
    }
}

impl From<sqlx::Error> for AppErr {
    fn from(value: sqlx::Error) -> Self {
        if matches!(value, sqlx::Error::RowNotFound) {
            return NestError::NotFound.into();
        }

        log::error!("sqlx error: {value} ({value:?})");
        match value {
            sqlx::Error::RowNotFound => unreachable!(),
            sqlx::Error::Database(e) => match e.code() {
                Some(c) if c == "2067" => NestError::NotUnique,
                Some(c) if c == "787" => NestError::NotFound,
                _ => NestError::DatabaseError,
            },
            _ => NestError::DatabaseError,
        }
        .into()
    }
}

macro_rules! fse {
    ($ty:path) => {
        impl From<$ty> for AppErr {
            fn from(value: $ty) -> Self {
                log::error!("_500_: [{}] {value:?}", stringify!($ty));
                Self::server_error().debug(stringify!($ty))
            }
        }
    };
}

fse!(std::io::Error);
fse!(reqwest::Error);
