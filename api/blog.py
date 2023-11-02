
from fastapi import APIRouter, Request, Response
from sqlalchemy import delete, insert, select, update

from db.models import BlogCategoryModel, BlogCategoryTable, BlogContentModel
from db.models import BlogContentTable, BlogModel, BlogTable, BlogTagModel
from db.models import BlogTagTable, ProjectModel, ProjectTable
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
async def blog_category_list(request: Request, page: int = 0):
    project: ProjectModel = request.state.project

    rows = await sqlx.fetch_all(
        select(BlogCategoryTable)
        .where(BlogCategoryTable.project == project.project_id)
        .limit(config.page_size)
        .offset(page * config.page_size)
    )

    return [BlogCategoryModel(**r) for r in rows]
