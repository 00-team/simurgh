
from sqlalchemy import delete, insert, select, update

from shared import sqlx

from .models import ProjectModel, ProjectTable


async def project_get(project_id: int) -> ProjectModel | None:
    row = await sqlx.fetch_one(
        select(ProjectTable)
        .where(ProjectTable.project_id == project_id),
    )
    if row is None:
        return None

    return ProjectModel(**row)


async def project_update(project_id: int, **values: dict):
    await sqlx.execute(
        update(ProjectTable)
        .where(ProjectTable.project_id == project_id),
        values
    )


async def project_add(**values: dict) -> int:
    return await sqlx.execute(insert(ProjectTable), values)


async def project_delete(project_id: int) -> int:
    return await sqlx.execute(
        delete(ProjectTable)
        .where(ProjectTable.project_id == project_id)
    )
