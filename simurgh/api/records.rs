use actix_multipart::form::MultipartForm;
use actix_multipart::form::json::Json as MPJson;
use actix_multipart::form::tempfile::TempFile;
use actix_web::web::{Data, Json, Query};
use actix_web::{HttpResponse, Scope, delete, get, patch, post};
use media::{MediaPhoto, RecordPath, RecordPathKind};
use nest::utils::random_salt;
use utoipa::{OpenApi, ToSchema};

use crate::docs::UpdatePaths;
use crate::models::project::Project;
use crate::models::record::{Record, RecordKind, RecordUsage};
use crate::models::{Horp, Jorp, JsonStr, ListInput, Response};
use crate::state::SimurghDb;

#[derive(OpenApi)]
#[openapi(
    tags((name = "api::records")),
    paths(
        r_list, r_get, r_update, r_photo_add, r_delete
    ),
    components(schemas(Record, RecordUpload, RecordUpdateBody, RecordUsage)),
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
async fn r_list(
    project: Project, q: Query<ListInput>, db: Data<SimurghDb>,
) -> Response<Vec<Record>> {
    let offset = q.page * 32;
    let result = sqlx::query_as! {
        Record,
        "select * from records where project = ? order by id desc limit 32 offset ?",
        project.id, offset
    }
    .fetch_all(&db.sql)
    .await?;

    Ok(Json(result))
}

#[derive(Debug, MultipartForm, ToSchema)]
pub struct RecordUpload {
    #[schema(value_type = String, format = Binary)]
    #[multipart(limit = "200MB")]
    pub record: TempFile,
    #[schema(value_type = Vec<RecordUsage>)]
    pub usages: MPJson<Vec<RecordUsage>>,
}

#[utoipa::path(
    post,
    params(("pid" = i64, Path, example = 1)),
    request_body(content = RecordUpload, content_type = "multipart/form-data"),
    responses((status = 200, body = Record))
)]
/// Add Photo
#[post("/photo/")]
async fn r_photo_add(
    project: Project, form: MultipartForm<RecordUpload>, db: Data<SimurghDb>,
) -> Response<Record> {
    let now = nest::sys_now() as i64;
    let salt = random_salt();
    // let size = form.record.size as i64;
    // let mime = form.record.content_type.map(|c| c.to_string());

    let usages = JsonStr(form.usages.0.clone());

    let pp = form.record.file.path();
    let (temp, info) = MediaPhoto::new(pp, form.record.file_name.clone())?
        .resize(2048, 2048)
        .encode()?;

    let record = sqlx::query_as! {
        Record,
        "insert into records(project, salt, size, created_at, kind, usages)
        values(?,?,?,?,?,?) returning *",
        project.id, salt, info.size, now, RecordKind::Photo, usages
    }
    .fetch_one(&db.sql)
    .await?;

    temp.save(project.id, record.id, record.salt.clone())?;

    // let record = Record {
    //     id: result.last_insert_rowid(),
    //     project: Some(project.id),
    //     salt,
    //     name,
    //     size,
    //     mime,
    //     usages,
    //     created_at: now,
    // };

    // utils::save_record(form.record.file.path(), record.id, &record.salt)?;

    sqlx::query! {
        "update projects set
            storage = storage + ?,
            record_count = record_count + 1
        where id = ?",
        record.size, project.id
    }
    .execute(&db.sql)
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
async fn r_get(record: Record) -> Response<Record> {
    Ok(Json(record))
}

#[derive(serde::Deserialize, utoipa::ToSchema)]
struct RecordUpdateBody {
    usages: Vec<RecordUsage>,
}

#[utoipa::path(
    patch,
    params(("pid" = i64, Path, example = 1), ("rid" = i64, Path, example = 1)),
    request_body = RecordUpdateBody,
    responses((status = 200, body = Record))
)]
/// Update
#[patch("/{rid}/")]
async fn r_update(
    record: Record, body: Json<RecordUpdateBody>, db: Data<SimurghDb>,
) -> Jorp<Record> {
    let mut record = record;
    record.usages = JsonStr(body.usages.clone());

    sqlx::query! {
        "update records set usages = ? where id = ?",
        record.usages, record.id
    }
    .execute(&db.sql)
    .await?;

    Ok(Json(record))
}

#[utoipa::path(
    delete,
    params(("pid" = i64, Path, example = 1), ("rid" = i64, Path, example = 1)),
    responses((status = 200))
)]
/// Delete
#[delete("/{rid}/")]
async fn r_delete(record: Record, db: Data<SimurghDb>) -> Horp {
    let pid = record.project;
    RecordPath::new(record.id, record.salt, RecordPathKind::Webp, pid).delete();

    sqlx::query! {
        "update projects set storage = storage - ?,
        record_count = record_count - 1 where id = ?",
        record.size, pid
    }
    .execute(&db.sql)
    .await?;

    sqlx::query! {
        "delete from records where id = ?",
        record.id
    }
    .execute(&db.sql)
    .await?;

    Ok(HttpResponse::Ok().finish())
}

pub fn router() -> Scope {
    Scope::new("/{pid}/records")
        .service(r_photo_add)
        .service(r_list)
        .service(r_get)
        .service(r_update)
        .service(r_delete)
}
