
import time
from sqlite3 import IntegrityError
from typing import ClassVar

from fastapi import APIRouter, Request, Response
from pydantic import BaseModel
from sqlalchemy import delete, insert, select, update

from db.models import BlogCategoryTable, BlogContentModel, BlogContentTable
from db.models import BlogModel, BlogTable, ProjectModel, ProjectTable
from db.models import RecordModel, RecordTable, UserModel
from deps import blog_required
from shared import config, sqlx
from shared.locale import err_already_exists, err_bad_id
from shared.tools import utc_now
from shared.validators import Slug

router = APIRouter(tags=['blogs'])


@router.get('/')
async def blog_list(request: Request, page: int = 0):
    project: ProjectModel = request.state.project

    rows = await sqlx.fetch_all(
        select(BlogTable)
        .where(BlogTable.project == project.project_id)
        .limit(config.page_size)
        .offset(page * config.page_size)
    )

    return [BlogModel(**r) for r in rows]


class ContentResult(BlogContentModel):
    content: ClassVar


class BlogResult(BaseModel):
    blog: BlogModel
    contents: list[ContentResult]


@router.get(
    '/{blog_id}/', response_model=BlogResult,
    openapi_extra={'errors': [err_bad_id]},
    dependencies=[blog_required()]
)
async def blog_get(request: Request, blog_id: int):
    blog: BlogModel = request.state.blog

    contents = await sqlx.fetch_all(
        select(BlogContentTable)
        .where(BlogContentTable.blog == blog.blog_id)
    )

    return {
        'blog': blog,
        'contents': [ContentResult(**c) for c in contents],
    }


@router.post('/', response_model=BlogModel)
async def blog_add(request: Request):
    project: ProjectModel = request.state.project
    user: UserModel = request.state.user

    n = 0
    blog = BlogModel(
        blog_id=0,
        slug=f'b-00-{project.blogs}-{(time.time())}-{n}',
        project=project.project_id,
        author=user.user_id,
        created_at=utc_now(),
    )

    while True:
        try:
            blog_id = await sqlx.execute(
                insert(BlogTable),
                blog.dict(exclude={'blog_id'})
            )
            blog.blog_id = blog_id
            break
        except IntegrityError:
            n += 1
            blog.slug = f'b-00-{project.blogs}-{(time.time())}-{n}',

    await sqlx.execute(
        update(ProjectTable)
        .where(ProjectTable.project_id == project.project_id),
        {'blogs': project.blogs + 1}
    )

    return blog


@router.delete(
    '/{blog_id}/', openapi_extra={'errors': [err_bad_id]},
    dependencies=[blog_required()]
)
async def blog_delete(request: Request):
    project: ProjectModel = request.state.project
    blog: BlogModel = request.state.blog

    await sqlx.execute(
        delete(BlogTable)
        .where(
            BlogTable.project == blog.project,
            BlogTable.blog_id == blog.blog_id
        )
    )

    await sqlx.execute(
        update(ProjectTable)
        .where(ProjectTable.project_id == project.project_id),
        {'blogs': project.blogs - 1}
    )

    return Response()


class UpdateBody(BaseModel):
    slug: Slug = None
    thumbnail: int = None
    read_time: int = None
    category: int = None


@router.patch(
    '/{blog_id}/',
    openapi_extra={'errors': [err_bad_id, err_already_exists]},
    dependencies=[blog_required()]
)
async def blog_update(request: Request, body: UpdateBody):
    project: ProjectModel = request.state.project
    blog: BlogModel = request.state.blog

    patch = {
        'edited_at': utc_now()
    }

    if body.slug:
        result = await sqlx.fetch_one(
            select(BlogTable)
            .where(
                BlogTable.slug == body.slug,
                BlogTable.project == project.project_id
            )
        )

        if result:
            raise err_already_exists(item='blog', key='slug', value=body.slug)

        patch['slug'] = body.slug

    if body.category:
        result = await sqlx.fetch_one(
            select(BlogCategoryTable)
            .where(
                BlogCategoryTable.project == project.project_id,
                BlogCategoryTable.category_id == body.category
            )
        )
        if not result:
            raise err_bad_id(item='category', id=body.category)

        patch['category'] = body.category

    if body.read_time:
        patch['read_time'] = body.read_time

    if body.thumbnail:
        result = await sqlx.fetch_one(
            select(RecordTable)
            .where(
                RecordTable.project == project.project_id,
                RecordTable.record_id == body.thumbnail
            )
        )
        if not result:
            raise err_bad_id(item='thumbnail', id=body.thumbnail)

        record = RecordModel(**result)
        patch['thumbnail'] = record.record_id
        patch['thumbnail_url'] = record.url

    await sqlx.execute(
        update(BlogTable)
        .where(BlogTable.blog_id == blog.blog_id),
        patch
    )

    return Response()
