use actix_multipart::form::tempfile::TempFile;
use actix_multipart::form::MultipartForm;
use actix_web::web::{Data, Json, Query};
use actix_web::{delete, get, post, HttpResponse, Scope};
use utoipa::{OpenApi, ToSchema};

use crate::docs::UpdatePaths;
use crate::models::project::Project;
use crate::models::record::Record;
use crate::models::{AppErr, ListInput, Response};
use crate::{utils, AppState};

#[derive(OpenApi)]
#[openapi(
    tags((name = "api::records")),
    paths(
        record_list, record_get, record_add, record_delete
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
    #[multipart(limit = "200MB")]
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

    utils::save_record(form.record.file.path(), record.id, &record.salt)?;

    sqlx::query! {
        "update projects set storage = storage + ?,
        record_count = record_count + 1 where id = ?",
        record.size, project.id
    }
    .execute(&state.sql)
    .await?;

    Ok(Json(record))
}

#[utoipa::path(
    get,
    params(("pid" = i64, Path, example = 1), ("rid" = i64, Path, example = 1)),
    responses((status = 200, body = Record))
)]
/// Get
#[get("/{rid}/")]
async fn record_get(record: Record) -> Response<Record> {
    Ok(Json(record))
}

#[utoipa::path(
    delete,
    params(("pid" = i64, Path, example = 1), ("rid" = i64, Path, example = 1)),
    responses((status = 200))
)]
/// Delete
#[delete("/{rid}/")]
async fn record_delete(
    record: Record, state: Data<AppState>,
) -> Result<HttpResponse, AppErr> {
    utils::remove_record(&format!("r-{}-{}", record.id, record.salt));

    if let Some(pid) = record.project {
        sqlx::query! {
            "update projects set storage = storage - ?,
            record_count = record_count - 1 where id = ?",
            record.size, pid
        }
        .execute(&state.sql)
        .await?;
    }

    sqlx::query! {
        "delete from records where id = ?",
        record.id
    }
    .execute(&state.sql)
    .await?;

    Ok(HttpResponse::Ok().finish())
}

pub fn router() -> Scope {
    Scope::new("/{pid}/records")
        .service(record_add)
        .service(record_list)
        .service(record_get)
        .service(record_delete)
}
