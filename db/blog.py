
from sqlalchemy import delete, insert, select, update

from shared import sqlx

from .models import BlogModel, BlogTable


async def blog_get(*where) -> BlogModel | None:
    row = await sqlx.fetch_one(select(BlogTable).where(*where))
    if row is None:
        return None

    return BlogModel(**row)


async def blog_update(*where, **values: dict):
    await sqlx.execute(
        update(BlogTable).where(*where),
        values
    )


async def blog_add(**values: dict) -> int:
    return await sqlx.execute(insert(BlogTable), values)


async def blog_delete(*where) -> int:
    return await sqlx.execute(delete(BlogTable).where(*where))
