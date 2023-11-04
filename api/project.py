
import subprocess

from fastapi import APIRouter, Request, Response
from pydantic import BaseModel, constr
from sqlalchemy import delete, insert, select, update

from api.blog import router as blog_router
from api.record import router as record_router
from db.models import ProjectModel, ProjectTable, UserModel
from deps import project_required, rate_limit, user_required
from shared import config, sqlx
from shared.locale import err_bad_id, err_forbidden, err_no_change
from shared.locale import err_too_many_projects
from shared.tools import new_token, utc_now

router = APIRouter(
    prefix='/projects',
    dependencies=[user_required()]
)

router.include_router(record_router)
router.include_router(blog_router)


project_router = APIRouter(
    tags=['project'],
    dependencies=[rate_limit('projects', 60, 30)]
)


@project_router.get(
    '/', response_model=list[ProjectModel],
    openapi_extra={'errors': [err_forbidden]}
)
async def project_list(request: Request, page: int = 0):
    user: UserModel = request.state.user
    if not user.client:
        raise err_forbidden

    rows = await sqlx.fetch_all(
        select(ProjectTable)
        .where(ProjectTable.creator == user.user_id)
        .limit(config.page_size)
        .offset(page * config.page_size)
    )

    return [ProjectModel(**r) for r in rows]


@project_router.post(
    '/', response_model=ProjectModel,
    openapi_extra={'errors': [err_too_many_projects, err_forbidden]}
)
async def project_add(request: Request):
    user: UserModel = request.state.user
    if not user.client:
        raise err_forbidden

    total = (await sqlx.fetch_one(
        '''
        SELECT COUNT(project_id) from project WHERE creator = :user_id
        ''',
        {'user_id': user.user_id}
    ))[0]

    if total >= config.max_projects:
        raise err_too_many_projects

    token, _ = new_token()

    project = ProjectModel(
        project_id=0,
        creator=user.user_id,
        name='new project',
        storage=0,
        blogs=0,
        records=0,
        created_at=utc_now(),
        edited_at=0,
        api_key=token
    )

    args = project.dict(exclude={'project_id'})

    project_id = await sqlx.execute(insert(ProjectTable), args)
    project.project_id = project_id

    return project


@project_router.get(
    '/{project_id}/', response_model=ProjectModel,
    dependencies=[project_required()],
)
async def project_get(request: Request):
    return request.state.project


@project_router.delete(
    '/{project_id}/',
    dependencies=[project_required()]
)
async def project_delete(request: Request):
    project: ProjectModel = request.state.project

    path = config.record_dir / str(project.project_id)
    if path.exists():
        path = path.rename(config.record_dir / f'{project.project_id}.deleted')
        subprocess.run(['rm', '-r', '-f', str(path)])

    await sqlx.execute(delete(ProjectTable).where(
        ProjectTable.project_id == project.project_id,
        ProjectTable.creator == project.creator
    ))

    return Response()


class UpdateBody(BaseModel):
    name: constr(
        strict=True,
        strip_whitespace=True,
        min_length=3,
        max_length=255
    ) | None = None
    api_key: bool = False


@project_router.patch(
    '/{project_id}/', response_model=ProjectModel,
    dependencies=[project_required()],
    openapi_extra={'errors': [err_no_change]}
)
async def project_update(request: Request, body: UpdateBody):
    project: ProjectModel = request.state.project

    patch = {
        'edited_at': utc_now(),
    }
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

    await sqlx.execute(
        update(ProjectTable)
        .where(
            ProjectTable.project_id == project.project_id,
            ProjectTable.creator == project.creator,
        ),
        patch
    )

    result = await sqlx.fetch_one(select(ProjectTable).where(
        ProjectTable.project_id == project.project_id,
        ProjectTable.creator == project.creator,
    ))
    if result is None:
        raise err_bad_id(item='Project', id=project.project_id)

    return ProjectModel(**result)


router.include_router(project_router)
