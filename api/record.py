
import mimetypes
import os

import magic
from fastapi import APIRouter, Depends, Request, Response, UploadFile
from pydantic import BaseModel, constr

from db.models import ProjectModel, ProjectTable, RecordModel, RecordPublic
from db.models import RecordTable, UserModel
from db.project import project_add, project_delete, project_get, project_update
from db.record import record_add, record_delete
from deps import project_required, rate_limit, user_required
from shared import config, sqlx
from shared.locale import err_bad_file, err_bad_id, err_no_change
from shared.locale import err_too_many_projects
from shared.tools import new_token, utc_now

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

    if not record.path.parent.exists():
        record.path.parent.mkdir(parents=True, exist_ok=True)

    with open(record.path, 'wb') as f:
        while (chunk := file.file.read(1024 * 8)):
            f.write(chunk)

    return record.public()
