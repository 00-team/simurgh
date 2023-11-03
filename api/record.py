
import mimetypes
import os

import magic
from fastapi import APIRouter, Request, Response, UploadFile
from sqlalchemy import delete, insert, select, update

from db.models import ProjectModel, ProjectTable, RecordModel, RecordPublic
from db.models import RecordTable
from deps import project_required, rate_limit
from shared import config, sqlx
from shared.locale import err_bad_file, err_bad_id
from shared.tools import utc_now

router = APIRouter(
    prefix='/{project_id}/records',
    tags=['record'],
    dependencies=[
        rate_limit('projects:records', 60, 30),
        project_required(),
    ]
)


async def get_record(record_id: int, project_id: int) -> RecordModel:
    result = await sqlx.fetch_one(select(RecordTable).where(
        RecordTable.record_id == record_id,
        RecordTable.project == project_id
    ))

    if result is None:
        raise err_bad_id(item='Record', id=record_id)

    return RecordModel(**result)


@router.get('/', response_model=list[RecordPublic])
async def record_list(request: Request, page: int = 0):
    project: ProjectModel = request.state.project

    rows = await sqlx.fetch_all(
        select(RecordTable)
        .where(RecordTable.project == project.project_id)
        .limit(config.page_size)
        .offset(page * config.page_size)
    )

    return [RecordModel(**r).public() for r in rows]


@router.get('/{record_id}/', response_model=RecordPublic)
async def record_get(request: Request, record_id: int):
    project: ProjectModel = request.state.project

    record = await get_record(record_id, project.project_id)
    return record.public()


@router.post(
    '/', response_model=RecordPublic,
    openapi_extra={'errors': [err_bad_file]}
)
async def record_add(request: Request, file: UploadFile):
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

    async with sqlx.transaction():
        record_id = await sqlx.execute(insert(RecordTable), args)
        record.record_id = record_id

        await sqlx.execute(
            update(ProjectTable)
            .where(
                ProjectTable.project_id == project.project_id
            ),
            dict(
                storage=project.storage + file.size,
                records=project.records + 1
            )
        )

    if not record.path.parent.exists():
        record.path.parent.mkdir(parents=True, exist_ok=True)

    with open(record.path, 'wb') as f:
        while (chunk := file.file.read(1024 * 8)):
            f.write(chunk)

    return record.public()


@router.delete(
    '/{record_id}/',
    openapi_extra={'errors': [err_bad_id]}
)
async def record_delete(request: Request, record_id: int):
    project: ProjectModel = request.state.project

    record = await get_record(record_id, project.project_id)
    record.path.unlink(True)

    async with await sqlx.transaction():
        await sqlx.execute(delete(RecordTable).where(
            RecordTable.record_id == record_id,
            RecordTable.project == project.project_id
        ))

        await sqlx.execute(
            update(ProjectTable)
            .where(
                ProjectTable.project_id == project.project_id
            ),
            dict(
                storage=project.storage - record.size,
                records=project.records - 1
            )
        )

    return Response()
