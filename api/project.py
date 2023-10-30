
from fastapi import APIRouter, Request, Response
from pydantic import BaseModel, constr

from db.models import ProjectModel, ProjectTable, UserModel
from db.project import project_add, project_delete, project_get, project_update
from deps import rate_limit, user_required
from shared import config, sqlx
from shared.locale import err_bad_id, err_no_change, err_too_many_projects
from shared.tools import new_token

router = APIRouter(
    prefix='/projects',
    tags=['project'],
    dependencies=[user_required(), rate_limit('projects', 60, 30)]
)


@router.get('/', response_model=list[ProjectModel])
async def projects(request: Request, page: int = 0):
    user: UserModel = request.state.user

    rows = await sqlx.fetch_all(
        f'''
        SELECT * from projects WHERE creator = :user_id
        LIMIT {config.page_size} OFFSET {page * config.page_size}
        ''',
        {'user_id': user.user_id}
    )

    return [ProjectModel(**r) for r in rows]


@router.post(
    '/', response_model=ProjectModel,
    openapi_extra={'errors': [err_too_many_projects]}
)
async def create(request: Request):
    user: UserModel = request.state.user

    total = (await sqlx.fetch_one(
        '''
        SELECT COUNT(project_id) from projects WHERE creator = :user_id
        ''',
        {'user_id': user.user_id}
    ))[0]

    if total >= config.max_projects:
        raise err_too_many_projects

    token, _ = new_token()

    project_id = await project_add(
        name='new project',
        creator=user.user_id,
        api_key=token
    )

    return {
        'project_id': project_id,
        'name': 'new project',
        'creator': user.user_id,
        'api_key': token
    }


@router.get(
    '/{project_id}/', response_model=ProjectModel,
    openapi_extra={'errors': [err_bad_id]}
)
async def get(request: Request, project_id: int):
    user: UserModel = request.state.user

    project = await project_get(
        ProjectTable.project_id == project_id,
        ProjectTable.creator == user.user_id
    )
    if not project:
        raise err_bad_id(item='Project', id=project_id)

    return project


@router.delete('/{project_id}/', openapi_extra={'errors': [err_bad_id]})
async def delete(request: Request, project_id: int):
    user: UserModel = request.state.user

    project = await project_get(
        ProjectTable.project_id == project_id,
        ProjectTable.creator == user.user_id
    )
    if not project:
        raise err_bad_id(item='Project', id=project_id)

    # TODO: delete all the records releated to this project

    await project_delete(
        ProjectTable.project_id == project_id,
        ProjectTable.creator == user.user_id
    )

    return Response()


class UpdateBody(BaseModel):
    name: constr(
        strict=True,
        strip_whitespace=True,
        min_length=3,
        max_length=255
    ) | None = None
    api_key: bool = False


@router.patch(
    '/{project_id}/', response_model=ProjectModel,
    openapi_extra={'errors': [err_bad_id, err_no_change]}
)
async def update(request: Request, project_id: int, body: UpdateBody):
    user: UserModel = request.state.user

    project = await project_get(
        ProjectTable.project_id == project_id,
        ProjectTable.creator == user.user_id
    )
    if not project:
        raise err_bad_id(item='Project', id=project_id)

    patch = {}
    change = False

    if body.api_key:
        change = True
        token, _ = new_token()
        patch['api_key'] = token

    if body.name and body.name != project.name:
        change = True
        patch['name'] = body.name

    if not change:
        raise err_no_change

    await project_update(
        ProjectTable.project_id == project_id,
        ProjectTable.creator == user.user_id,
        **patch
    )

    project = await project_get(
        ProjectTable.project_id == project_id,
        ProjectTable.creator == user.user_id
    )
    if not project:
        raise err_bad_id(item='Project', id=project_id)

    return project
