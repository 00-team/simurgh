
from sqlalchemy import insert, select, update

from shared import sqlx

from .models import UserModel, UserPublic, UserTable


async def user_get(*where) -> UserModel | None:
    row = await sqlx.fetch_one(select(UserTable).where(*where))
    if row is None:
        return None

    return UserModel(**row)


async def user_public(user_ids: list[int]) -> dict[int, UserPublic]:
    value = '(' + ','.join((str(i) for i in user_ids)) + ')'
    users = await sqlx.fetch_all(
        f'''
        SELECT user_id, name
        FROM user WHERE user_id IN {value}
        '''
    )

    result = {}

    for u in users:
        result[u[0]] = UserPublic(**u)

    return result
