
from fastapi import APIRouter

from api.blog import blog, category, content
from deps import project_required, rate_limit

router = APIRouter(
    prefix='/{project_id}/blogs',
    dependencies=[
        rate_limit('projects:blogs', 60, 30),
        project_required(),
    ]
)

router.include_router(category.router)
router.include_router(content.router)
router.include_router(blog.router)
