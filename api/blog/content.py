
from sqlite3 import IntegrityError
from typing import ClassVar

from fastapi import APIRouter, Query, Request, Response
from pydantic import BaseModel, constr
from sqlalchemy import delete, insert, select, update

from db.models import BlogContentModel, BlogContentTable, BlogModel
from deps import blog_required
from shared import config, sqlx
from shared.locale import err_already_exists, err_bad_id
from shared.validators import LangCode

router = APIRouter(
    prefix='/{blog_id}/contents',
    tags=['blog contents'],
    dependencies=[blog_required()]
)


class ContentResult(BlogContentModel):
    content: ClassVar


@router.get('/', response_model=list[ContentResult])
async def blog_content_list(request: Request, page: int = 0):
    blog: BlogModel = request.state.blog

    rows = await sqlx.fetch_all(
        select(BlogContentTable)
        .where(BlogContentTable.blog == blog.blog_id)
        .limit(config.page_size)
        .offset(page * config.page_size)
    )

    return [ContentResult(**r) for r in rows]


@router.get(
    '/{content_id}/', response_model=BlogContentModel,
    openapi_extra={'errors': [err_bad_id]}
)
async def blog_content_get(request: Request, content_id: int):
    blog: BlogModel = request.state.blog

    result = await sqlx.fetch_one(
        select(BlogContentTable)
        .where(
            BlogContentTable.content_id == content_id,
            BlogContentTable.blog == blog.blog_id
        )
    )
    if not result:
        raise err_bad_id(item='content', id=content_id)

    return BlogContentModel(**result)


@router.post(
    '/', response_model=BlogContentModel,
    openapi_extra={'errors': [err_already_exists]}
)
async def blog_content_add(request: Request, lang=Query(annotation=LangCode)):
    blog: BlogModel = request.state.blog

    content = BlogContentModel(
        content_id=0,
        blog=blog.blog_id,
        lang=lang,
        title='new blog',
        description='',
        content='',
    )

    try:
        content_id = await sqlx.execute(
            insert(BlogContentTable),
            content.dict(exclude={'content_id'})
        )
        content.content_id = content_id
    except IntegrityError:
        raise err_already_exists(item='content', key='lang', value=lang)

    return content


class UpdateBody(BaseModel):
    title: constr(min_length=1, max_length=256) = None
    description: constr(min_length=1, max_length=512) = None
    content: str = None


@router.patch(
    '/{content_id}/',
    openapi_extra={'errors': [err_bad_id]}
)
async def blog_content_update(
    request: Request, content_id: int, body: UpdateBody
):
    blog: BlogModel = request.state.blog

    result = await sqlx.fetch_one(
        select(BlogContentTable)
        .where(
            BlogContentTable.content_id == content_id,
            BlogContentTable.blog == blog.blog_id
        )
    )
    if not result:
        raise err_bad_id(item='content', id=content_id)

    patch = body.dict(exclude_defaults=True)

    await sqlx.execute(
        update(BlogContentTable)
        .where(
            BlogContentTable.content_id == content_id,
            BlogContentTable.blog == blog.blog_id
        ),
        patch
    )

    return Response()


@router.delete(
    '/{content_id}/',
    openapi_extra={'errors': [err_bad_id]}
)
async def blog_content_delete(request: Request, content_id: int):
    blog: BlogModel = request.state.blog

    result = await sqlx.execute(
        delete(BlogContentTable)
        .where(
            BlogContentTable.content_id == content_id,
            BlogContentTable.blog == blog.blog_id
        )
    )

    if not result:
        raise err_bad_id(item='content', id=content_id)

    return Response()
