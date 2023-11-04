
from fastapi import APIRouter, Request, Response
from sqlalchemy import delete, insert, select, update

from api.blog import blog, category
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
        rate_limit('projects:blogs', 60, 30),
        project_required(),
    ]
)

router.include_router(category.router)
router.include_router(blog.router)
