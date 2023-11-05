
from fastapi import Depends, Request
from sqlalchemy import select

from db.models import BlogModel, BlogTable, ProjectModel
from deps.project import project_required
from shared import sqlx
from shared.locale import err_bad_id, err_forbidden


def blog_required():
    async def inner(
        request: Request, blog_id: int,
        project: ProjectModel = project_required(),
    ):
        blog: BlogModel = getattr(request.state, 'blog', None)
        if blog is not None and blog.blog_id == blog_id:
            if blog.project == project.project_id:
                return blog
            else:
                raise err_bad_id(item='blog', id=blog_id)

        result = await sqlx.fetch_one(select(BlogTable).where(
            BlogTable.blog_id == blog_id,
            BlogTable.project == project.project_id
        ))
        if result is None:
            raise err_bad_id(item='blog', id=blog_id)

        blog = BlogModel(**result)

        request.state.blog = blog
        return blog

    dep = Depends(inner)
    dep.errors = [err_bad_id, err_forbidden]
    return dep
