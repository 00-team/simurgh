
from sqlalchemy import delete, insert, select, update

from shared import sqlx

from .models import ProjectModel, ProjectTable


async def project_get(*where) -> ProjectModel | None:
    row = await sqlx.fetch_one(select(ProjectTable).where(*where))
    if row is None:
        return None

    return ProjectModel(**row)


async def project_update(*where, **values) -> int:
    return await sqlx.execute(update(ProjectTable).where(*where), values)


async def project_add(**values) -> int:
    return await sqlx.execute(insert(ProjectTable), values)


async def project_delete(*where) -> int:
    return await sqlx.execute(delete(ProjectTable).where(*where))
