
from sqlite3 import IntegrityError

from fastapi import APIRouter, Query, Request, Response
from pydantic import BaseModel, validator
from sqlalchemy import delete, insert, select, update

from db.models import BlogCategoryModel, BlogCategoryTable, ProjectModel
from shared import config, sqlx
from shared.locale import err_already_exists, err_bad_id
from shared.validators import Slug, lang_validator

router = APIRouter(
    prefix='/categories',
    tags=['blog category']
)


@router.get('/', response_model=list[BlogCategoryModel])
async def blog_category_list(request: Request, page: int = 0):
    project: ProjectModel = request.state.project

    rows = await sqlx.fetch_all(
        select(BlogCategoryTable)
        .where(BlogCategoryTable.project == project.project_id)
        .limit(config.page_size)
        .offset(page * config.page_size)
    )

    return [BlogCategoryModel(**r) for r in rows]


@router.post(
    '/', response_model=BlogCategoryModel,
    openapi_extra={'errors': [err_already_exists]}
)
async def blog_category_add(request: Request, slug=Query(annotation=Slug)):
    project: ProjectModel = request.state.project

    category = BlogCategoryModel(
        category_id=0,
        project=project.project_id,
        slug=slug,
        label={}
    )
    category.label[config.lang] = slug

    try:
        category_id = await sqlx.execute(
            insert(BlogCategoryTable),
            category.dict(exclude={'category_id'})
        )
        category.category_id = category_id
    except IntegrityError:
        raise err_already_exists(item='Category', key='slug', value=slug)

    return category


class UpdateBody(BaseModel):
    label: dict[str, str]

    @validator('label')
    def v_label(value: dict):
        if not value.get(config.lang):
            raise ValueError(f'default lang ({config.lang}) must be in label')

        for k, v in value.items():
            if not v:
                raise ValueError(f'value of {k} connot be empty')

            lang_validator(k)

        return value


@router.patch(
    '/{category_id}/',
    openapi_extra={'errors': [err_bad_id]}
)
async def blog_category_update(
    request: Request, category_id: int, body: UpdateBody
):
    project: ProjectModel = request.state.project

    result = await sqlx.fetch_one(
        select(BlogCategoryTable)
        .where(
            BlogCategoryTable.category_id == category_id,
            BlogCategoryTable.project == project.project_id
        )
    )
    if not result:
        raise err_bad_id(item='Category', id=category_id)

    await sqlx.execute(
        update(BlogCategoryTable)
        .where(
            BlogCategoryTable.category_id == category_id,
            BlogCategoryTable.project == project.project_id
        ),
        {'label': body.label}
    )

    return Response()


@router.delete(
    '/{category_id}/',
    openapi_extra={'errors': [err_bad_id]}
)
async def blog_category_delete(request: Request, category_id: int):
    project: ProjectModel = request.state.project

    await sqlx.execute(
        delete(BlogCategoryTable)
        .where(
            BlogCategoryTable.category_id == category_id,
            BlogCategoryTable.project == project.project_id
        )
    )

    return Response()
