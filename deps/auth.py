

from hashlib import sha3_256, sha3_512

from fastapi import Depends, Request, Response, security
from fastapi.security import HTTPAuthorizationCredentials
from fastapi.security.utils import get_authorization_scheme_param

from db.models import AdminPerms, UserModel, UserTable
from db.rate_limit import rate_limit_get, rate_limit_set
from db.user import user_get
from shared.errors import bad_auth, forbidden, rate_limited


class HTTPBearer(security.HTTPBearer):
    async def __call__(self, request: Request) -> HTTPAuthorizationCredentials:
        authorization = request.headers.get(
            'Authorization',
            request.cookies.get('Authorization')
        )
        scheme, credentials = get_authorization_scheme_param(authorization)
        if not (authorization and scheme and credentials):
            raise bad_auth
        if scheme.lower() != "bearer":
            raise bad_auth

        return HTTPAuthorizationCredentials(scheme=scheme, credentials=credentials)


user_schema = HTTPBearer(description='User Token')

errors = [bad_auth, rate_limited]


def get_ip():
    '''get the client ip'''

    async def decorator(request: Request):
        forwarded = request.headers.get('X-Forwarded-For')

        if forwarded:
            ip = forwarded.split(',')[0]
        else:
            ip = request.client.host

        request.state.ip = ip

        return ip

    return Depends(decorator)


async def rate_limit(request, path_id):
    period = 3600
    amount = 10

    ip = request.state.ip
    identifier = sha3_256(f'{path_id}:{ip}'.encode('utf-8')).hexdigest()
    key = f'invalid_token:{identifier}'

    value, expire = await rate_limit_get(key)

    if value >= amount:
        raise rate_limited(headers={
            'X-RateLimit-Limit': str(amount),
            'X-RateLimit-Reset-After': str(expire)
        })

    await rate_limit_set(key, period)


def user_required():
    '''user token is required'''

    async def decorator(
        request: Request, response: Response,
        id_token: HTTPAuthorizationCredentials = Depends(user_schema)
    ):
        state = getattr(request.state, 'user', None)
        if isinstance(state, UserModel):
            return state

        try:
            user_id, token = id_token.credentials.split(':')
            user_id = int(user_id)
        except ValueError:
            await rate_limit(request, 'user_token_check')
            raise bad_auth

        user = await user_get(UserTable.user_id == user_id)

        if user is None:
            await rate_limit(request, 'user_token_check')
            raise bad_auth

        if user.token != sha3_512(token.encode()).hexdigest():
            await rate_limit(request, 'user_token_check')
            raise bad_auth

        request.state.user = user
        return user

    dep = Depends(decorator)
    dep.errors = errors
    return dep


def admin_required(perms: AdminPerms = None):
    '''admin token is required'''

    async def decorator(request: Request, user: UserModel = user_required()):
        if not user.is_admin:
            await rate_limit(request, 'admin_check')
            raise forbidden

        if perms is not None:
            user.admin_assert(perms)

    dep = Depends(decorator)
    dep.errors = errors + [forbidden]
    return dep
