
from sqlite3 import IntegrityError

from fastapi import APIRouter, Query, Request, Response
from pydantic import BaseModel, ValidationError, validator
from sqlalchemy import delete, insert, select, update

from db.models import BlogCategoryModel, BlogCategoryTable, BlogContentModel
from db.models import BlogContentTable, BlogModel, BlogTable, BlogTagModel
from db.models import BlogTagTable, ProjectModel, ProjectTable, UserModel
from deps import project_required, rate_limit, user_required
from shared import config, sqlx
from shared.locale import err_already_exists, err_bad_file, err_bad_id
from shared.tools import utc_now
from shared.validators import LangCode, Slug, lang_validator

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

    return [BlogModel.from_orm(r) for r in rows]


class AddBody(BaseModel):
    slug: Slug
    category: int = None


@router.post(
    '/', response_model=BlogModel,
    openapi_extra={'errors': [err_already_exists]}
)
async def blog_add(request: Request, body: AddBody):
    project: ProjectModel = request.state.project
    user: UserModel = request.state.user

    category = body.category
    if category:
        result = await sqlx.fetch_one(
            select(BlogCategoryTable)
            .where(
                BlogCategoryTable.project == project.project_id,
                BlogCategoryTable.category_id == category
            )
        )
        if result is None:
            category = None

    blog = BlogModel(
        blog_id=0,
        slug=body.slug,
        project=project.project_id,
        author=user.user_id,
        category=category,
        created_at=utc_now(),
        edited_at=0,
        thumbnail=None,
        read_time=0,
    )

    try:
        blog_id = await sqlx.execute(
            insert(BlogTable),
            blog.dict(exclude={'blog_id'})
        )
        blog.blog_id = blog_id
    except IntegrityError:
        raise err_already_exists(item='Blog', key='slug', value=body.slug)

    return blog
