use media::{RecordPath, RecordPathKind};

#[derive(Debug, Clone)]
#[derive(serde::Serialize, utoipa::ToSchema, serde::Deserialize)]
#[serde(rename_all = "snake_case", tag = "kind")]
pub enum RecordUsage {
    Blog { id: i64 },
    Free { reason: String },
}

#[potk::enum_int(i64)]
#[derive(PartialEq, Eq, Default, Clone, Copy, Debug)]
#[derive(serde::Serialize, serde::Deserialize, utoipa::ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum RecordKind {
    #[default]
    Photo,
    Video,
    Audio,
}

crate::sql_enum!(RecordKind);

#[derive(Debug, sqlx::FromRow, Clone)]
#[derive(serde::Serialize, serde::Deserialize, utoipa::ToSchema)]
pub struct Record {
    pub id: i64,
    pub project: i64,
    pub salt: String,
    pub tag: String,
    pub size: i64,
    pub created_at: i64,
    pub kind: RecordKind,
    // #[schema(value_type = Vec<RecordUsage>)]
    // pub usages: super::JsonStr<Vec<RecordUsage>>,
    pub duration: f64,
    pub has_m3u8: bool,
    pub width: i64,
    pub height: i64,
    pub usage_count: i64,
}

impl Record {
    pub fn as_path(&self) -> RecordPath {
        RecordPath::new(
            self.id,
            self.salt.clone(),
            match self.kind {
                RecordKind::Photo => RecordPathKind::Webp,
                RecordKind::Video => RecordPathKind::Mp4,
                RecordKind::Audio => RecordPathKind::Opus,
            },
            self.project,
        )
    }
}

super::from_request_under_project!(Record, "records");
