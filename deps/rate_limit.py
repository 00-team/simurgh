from hashlib import sha256

from fastapi import Depends, Request

from db.rate_limit import rate_limit_get, rate_limit_set
from shared import settings
from shared.errors import rate_limited

from .auth import user_required


def rate_limit(path_id: str, period: int, amount: int, use_id=True):
    async def check(identifier: str):
        if settings.debug:
            return

        value, expire = await rate_limit_get(identifier)

        if value >= amount:
            raise rate_limited(headers={
                'X-RateLimit-Limit': str(amount),
                'X-RateLimit-Reset-After': str(expire)
            })

        await rate_limit_set(identifier, period)

    async def with_id(user=user_required()):
        key = f'{path_id}:{user.user_id}'
        identifier = sha256(key.encode('utf-8')).hexdigest()
        await check(identifier)

    async def with_ip(request: Request):
        ip = request.state.ip
        identifier = sha256(f'{path_id}:{ip}'.encode('utf-8')).hexdigest()
        await check(identifier)

    if use_id:
        dep = Depends(with_id)
    else:
        dep = Depends(with_ip)

    dep.errors = [rate_limited]
    return dep
