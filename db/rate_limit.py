from shared import redis


async def rate_limit_get(identifier: str) -> tuple[int, int]:
    key = 'rate_limit:' + identifier

    value = await redis.get(key)
    if value is None:
        return (0, 0)

    expire = await redis.ttl(key)
    return (int(value), expire)


async def rate_limit_set(identifier: str, period: int):
    key = 'rate_limit:' + identifier

    exists = await redis.exists(key)

    if exists:
        await redis.incr(key, 1)
    else:
        await redis.set(key, 1, period)


__all__ = [
    'rate_limit_get',
    'rate_limit_set',
]
