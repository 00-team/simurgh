
from sqlalchemy import delete, insert, select, update

from shared import sqlx

from .models import RecordModel, RecordTable


async def record_exists(record_id: int) -> bool:
    return bool(await sqlx.fetch_one(
        select(RecordTable)
        .where(RecordTable.record_id == record_id)
    ))


async def record_get(record_id: int) -> RecordModel | None:
    row = await sqlx.fetch_one(
        select(RecordTable)
        .where(RecordTable.record_id == record_id)
    )
    if row is None:
        return None

    return RecordModel(**row)


async def record_update(record_id: int, **values: dict):
    await sqlx.execute(
        update(RecordTable)
        .where(RecordTable.record_id == record_id),
        values
    )


async def record_add(**values: dict) -> int:
    return await sqlx.execute(insert(RecordTable), values)


async def record_delete(record_id: int) -> int:
    return await sqlx.execute(
        delete(RecordTable)
        .where(RecordTable.record_id == record_id)
    )


async def record_list(record_ids: list[int]) -> dict[int, RecordModel]:
    value = '(' + ','.join((str(i) for i in record_ids)) + ')'
    rows = await sqlx.fetch_all(f'''
        SELECT * FROM records
        WHERE record_id IN {value}
    ''')

    result = {}

    for r in rows:
        record = RecordModel(**r)
        result[record.record_id] = record

    return result
