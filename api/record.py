
from fastapi import APIRouter, Depends, Request, Response
from pydantic import BaseModel, constr

from db.models import ProjectModel, ProjectTable, UserModel
from db.project import project_add, project_delete, project_get, project_update
from deps import project_required, rate_limit, user_required
from shared import config, sqlx
from shared.locale import err_bad_id, err_no_change, err_too_many_projects
from shared.tools import new_token

router = APIRouter(
    prefix='/{project_id}/records',
    dependencies=[
        user_required(),
        rate_limit('projects:records', 60, 30),
        project_required(),
    ]
)


@router.get('/')
async def records(request: Request, project_id: int):
    user: UserModel = request.state.user
    print(request.state)
