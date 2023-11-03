

from shared import sqlx

from .models import UserPublic


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
