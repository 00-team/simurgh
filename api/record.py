
import mimetypes
import os

import magic
from fastapi import APIRouter, Request, Response, UploadFile

from db.models import ProjectModel, ProjectTable, RecordModel, RecordPublic
from db.models import RecordTable
from db.project import project_update
from db.record import record_add, record_delete, record_get
from deps import project_required, rate_limit, user_required
from shared import config, sqlx
from shared.locale import err_bad_file, err_bad_id
from shared.tools import utc_now

router = APIRouter(
    prefix='/{project_id}/records',
    dependencies=[
        user_required(),
        rate_limit('projects:records', 60, 30),
        project_required(),
    ]
)


@router.get('/', response_model=list[RecordPublic])
async def get_records(request: Request, page: int = 0):
    project: ProjectModel = request.state.project

    rows = await sqlx.fetch_all(
        f'''
        SELECT * from records WHERE project = :project_id
        LIMIT {config.page_size} OFFSET {page * config.page_size}
        ''',
        {'project_id': project.project_id}
    )

    return [RecordModel(**r).public() for r in rows]


@router.post(
    '/', response_model=RecordPublic,
    openapi_extra={'errors': [err_bad_file]}
)
async def add_record(request: Request, file: UploadFile):
    project: ProjectModel = request.state.project

    mime = magic.from_buffer(file.file.read(2048), mime=True)
    file.file.seek(0)

    if not mime:
        raise err_bad_file

    ext = mimetypes.guess_extension(mime)
    # eg .png, .c, .jpg
    if ext is None or len(ext) < 2:
        raise err_bad_file

    record = RecordModel(
        record_id=0,
        project=project.project_id,
        salt=os.urandom(4),
        size=file.size,
        mime=mime,
        ext=ext[1:],
        timestamp=utc_now()
    )

    args = record.dict(exclude={'record_id'})
    record_id = await record_add(**args)
    record.record_id = record_id

    await project_update(
        ProjectTable.project_id == project.project_id,
        storage=project.storage + file.size,
        records=project.records + 1
    )

    if not record.path.parent.exists():
        record.path.parent.mkdir(parents=True, exist_ok=True)

    with open(record.path, 'wb') as f:
        while (chunk := file.file.read(1024 * 8)):
            f.write(chunk)

    return record.public()


@router.delete('/{record_id}/')
async def delete_record(request: Request, record_id: int):
    project: ProjectModel = request.state.project

    record = await record_get(
        RecordTable.record_id == record_id,
        RecordTable.project == project.project_id
    )
    if record is None:
        raise err_bad_id(item='Record', id=record_id)

    record.path.unlink(True)

    await record_delete(
        RecordTable.record_id == record_id,
        RecordTable.project == project.project_id
    )

    await project_update(
        ProjectTable.project_id == project.project_id,
        storage=project.storage - record.size,
        records=project.records - 1
    )

    return Response()
