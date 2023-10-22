
from sqlalchemy import insert, select, update

from shared import sqlx

from .models import DEFAULT_GENERAL, GeneralModel, GeneralTable


async def general_get() -> GeneralModel:
    row = await sqlx.fetch_one(
        select(GeneralTable)
        .where(GeneralTable.general_id == 0)
    )

    if row is None:
        await sqlx.execute(insert(GeneralTable), DEFAULT_GENERAL.dict())
        return DEFAULT_GENERAL

    return GeneralModel(**row)


async def general_update(**values: dict):
    await sqlx.execute(
        update(GeneralTable).where(GeneralTable.general_id == 0),
        values
    )
