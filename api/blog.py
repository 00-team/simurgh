
from fastapi import APIRouter, Request, Response, UploadFile

from db.models import ProjectModel, ProjectTable, RecordModel, RecordPublic
from db.models import RecordTable
from deps import project_required, rate_limit, user_required
from shared import config, sqlx
from shared.locale import err_bad_file, err_bad_id, err_database_error
from shared.tools import utc_now

router = APIRouter(
    prefix='/{project_id}/blogs',
    dependencies=[
        user_required(),
        rate_limit('projects:blogs', 60, 30),
        project_required(),
    ]
)


@router.get('/')
async def get_blogs(request: Request):
    project: ProjectModel = request.state.project

    return []
