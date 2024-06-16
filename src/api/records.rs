use actix_multipart::form::tempfile::TempFile;
use actix_multipart::form::MultipartForm;
use actix_web::web::{Data, Json, Query};
use actix_web::{get, post, Scope};
use utoipa::{OpenApi, ToSchema};

use crate::config::Config;
use crate::docs::UpdatePaths;
use crate::models::project::Project;
use crate::models::record::Record;
use crate::models::{ListInput, Response};
use crate::{utils, AppState};

#[derive(OpenApi)]
#[openapi(
    tags((name = "api::records")),
    paths(
        record_list, record_get, record_add
    ),
    components(schemas(Record, RecordUpload)),
    servers((url = "/projects/{pid}/records")),
    modifiers(&UpdatePaths)
)]
pub struct ApiDoc;

#[utoipa::path(
    get,
    params(("pid" = i64, Path, example = 1), ListInput),
    responses((status = 200, body = Vec<Record>))
)]
/// List
#[get("/")]
async fn record_list(
    project: Project, q: Query<ListInput>, state: Data<AppState>,
) -> Response<Vec<Record>> {
    let offset = q.page * 32;
    let result = sqlx::query_as! {
        Record,
        "select * from records where project = ? order by id desc limit 32 offset ?",
        project.id, offset
    }
    .fetch_all(&state.sql)
    .await?;

    Ok(Json(result))
}

#[derive(Debug, MultipartForm, ToSchema)]
pub struct RecordUpload {
    #[schema(value_type = String, format = Binary)]
    #[multipart(limit = "200 MiB")]
    pub record: TempFile,
}

#[utoipa::path(
    post,
    params(("pid" = i64, Path, example = 1)),
    request_body(content = RecordUpload, content_type = "multipart/form-data"),
    responses((status = 200, body = Record))
)]
/// Add
#[post("/")]
async fn record_add(
    project: Project, MultipartForm(form): MultipartForm<RecordUpload>,
    state: Data<AppState>,
) -> Response<Record> {
    let now = utils::now();
    let salt = utils::get_random_bytes(8);
    let size = form.record.size as i64;
    let mut ext: Option<String> = None;
    let mut mime: Option<String> = None;

    if let Some(m) = &form.record.content_type {
        mime = Some(m.to_string());
        ext = m.suffix().map(|a| a.to_string());
    }

    let result = sqlx::query! {
        "insert into records(project, salt, size, created_at, mime, ext) values(?,?,?,?,?,?)",
        project.id, salt, size, now, mime, ext
    }
    .execute(&state.sql)
    .await?;

    let record = Record {
        id: result.last_insert_rowid(),
        project: Some(project.id),
        salt,
        size,
        created_at: now,
        ..Default::default()
    };

    form.record.file.persist(
        std::path::Path::new(Config::RECORD_DIR)
            .join(format!("r-{}-{}", record.id, record.salt)),
    )?;

    Ok(Json(record))
}

#[utoipa::path(
    get,
    params(
        ("pid" = i64, Path, example = 1),
        ("rid" = i64, Path, example = 1),
    ),
    responses((status = 200, body = Record))
)]
/// Get
#[get("/{rid}/")]
async fn record_get(record: Record) -> Response<Record> {
    Ok(Json(record))
}

pub fn router() -> Scope {
    Scope::new("/{pid}/records")
        .service(record_add)
        .service(record_list)
        .service(record_get)
}
