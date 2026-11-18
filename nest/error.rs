use std::backtrace::Backtrace;

#[potk::enum_int(u16)]
#[derive(Debug, Default, Clone, Copy, PartialEq, Eq)]
#[derive(serde::Serialize, serde::Deserialize, utoipa::ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum NestError {
    #[default]
    Unknown = 0,

    BadRequest, // 400
    InvalidIpv4,
    NotUnique,
    BadPhone,
    BadFeedbackStatus,
    BadKindUnknown,
    BadSlug,
    NotDraft,
    RequestPending,
    MemberListFull,
    NotMember,
    AlreadyExists,
    SpiceBuild,
    InvalidTaskId,
    NotOrphan,
    NotPending,
    InvalidParent,
    CannotChangeKind,
    NotInvitable,
    AssociatedTopicsFull,
    SavedFull,
    BadAttributeValue,
    InvalidAttributeDef,
    ChangeWhileReordering,
    BadCode,
    MismatchCategoryKind,
    DetailTooLong,
    EmptyMessage,
    InvalidCode,
    IndexOutOfBounds,
    InvalidImage,
    EncodeWebpError,
    CloneInProgress,
    CloneFromSelf,
    InsufficientMoney,
    Expired,
    LimitReached,
    InvalidAudio,
    InvalidVideo,
    VideoTooShort,
    VideoTooLong,
    BadVideoSize,
    BadNationalId,
    BadPostalCode,
    NotInStock,
    IncompleteUserInfo,

    Forbidden, // 403
    BadAuth,
    PasswordMismatch,
    UserBanned,
    PermissionDenied,

    NotFound, // 404

    Conflict, // 409

    TooManyRequests, // 429
    RateLimited,

    InternalServerError, // 500
    ServerError,

    InvalidStateUnknownKind,
    ZstdCompressFailed,
    DatabaseError,
    ImageDownloadFailed,
    BadRecordPath,
    PaymentProcessorFailed,
    TopicRecordMediaMismatch,
    VideoConversion,

    ServiceUnavailable, // 503
}

impl NestError {
    pub const fn status(self) -> u16 {
        const UNKNOWN: u16 = NestError::Unknown as u16;
        const BAD_REQUEST: u16 = NestError::BadRequest as u16;
        const FORBIDDEN: u16 = NestError::Forbidden as u16;
        const NOT_FOUND: u16 = NestError::NotFound as u16;
        const CONFLICT: u16 = NestError::Conflict as u16;
        const TOO_MANY: u16 = NestError::TooManyRequests as u16;
        const INTERNAL: u16 = NestError::InternalServerError as u16;
        const UNAVAILABLE: u16 = NestError::ServiceUnavailable as u16;

        match self as u16 {
            UNKNOWN => 500,
            BAD_REQUEST..FORBIDDEN => 400,
            FORBIDDEN..NOT_FOUND => 403,
            NOT_FOUND..CONFLICT => 404,
            CONFLICT..TOO_MANY => 409,
            TOO_MANY..INTERNAL => 429,
            INTERNAL..UNAVAILABLE => 500,
            UNAVAILABLE.. => 503,
        }
    }
}

impl From<NestError> for NestErrorContext {
    fn from(value: NestError) -> Self {
        Self { status: value.status(), debug: None, code: value }
    }
}

#[derive(Debug, Clone)]
pub struct NestErrorContext {
    pub status: u16,
    pub code: NestError,
    pub debug: Option<String>,
}

impl NestErrorContext {
    pub fn new(code: NestError, debug: String) -> Self {
        Self { status: code.status(), code, debug: Some(debug) }
    }

    pub const fn server_error() -> Self {
        const CODE: NestError = NestError::ServerError;
        Self { status: CODE.status(), code: CODE, debug: None }
    }

    pub fn debug(mut self, debug: &str) -> Self {
        self.debug = Some(debug.to_string());
        self
    }
}

impl std::error::Error for NestErrorContext {}

impl std::fmt::Display for NestErrorContext {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(f, "{:?}", self)
    }
}

impl From<std::io::Error> for NestErrorContext {
    fn from(value: std::io::Error) -> Self {
        log::error!("io error: {value:?} at\n{}", Backtrace::force_capture());
        Self::server_error().debug("io error")
    }
}

// macro_rules! fse {
//     ($ty:path) => {
//         impl From<$ty> for NestErrorContext {
//             fn from(value: $ty) -> Self {
//                 log::error!("_500_: [{}] {value:?}", stringify!($ty));
//                 Self::server_error().debug(stringify!($ty))
//             }
//         }
//     };
// }
//
// fse!(std::io::Error);
// fse!(reqwest::Error);

#[macro_export]
macro_rules! err {
    ($code:ident) => {
        Err(nest::NestError::$code)?
    };

    ($code:ident, $debug:literal) => {
        Err(nest::NestErrorContext::new(
            nest::NestError::$code,
            $debug.to_string(),
        ))?
    };

    ($code:ident, $debug:expr) => {
        Err(nest::NestErrorContext::new(nest::NestError::$code, $debug))?
    }; //
       // ($code:ident, $debug:expr) => {
       //     Err(nest::NestErrorContext::from(nest::NestError::$code).debug(&$debug))
       // };
       //
       // (r, $code:ident) => {
       //     nest::NestErrorContext::from(nest::NestError::$code)
       // };
       //
       // (c, $code:ident) => {
       //     Err(nest::NestError::$code)
       // };
       //
       // (r,$code:ident, $debug:literal) => {
       //     nest::NestErrorContext::from(nest::NestError::$code).debug($debug)
       // };
       //
       // (r,$code:ident, $debug:expr) => {
       //     nest::NestErrorContext::from(nest::NestError::$code).debug(&$debug)
       // };
}
