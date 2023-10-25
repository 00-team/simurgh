
import hashlib

import httpx
from fastapi import APIRouter, Request, Response
from fastapi.responses import RedirectResponse
from pydantic import EmailStr

from db.models import UserModel, UserTable
from db.user import user_add, user_get, user_update
from deps import rate_limit
from shared import settings
from shared.letters import bad_auth, bad_id
from shared.tools import get_random_string, new_token

router = APIRouter(
    prefix='/auth',
    tags=['auth'],
    dependencies=[rate_limit('auth', 30 * 60, 20, False)]
)


@router.get('/login/', openapi_extra={'letters': [bad_auth, bad_id]})
async def login(request: Request, email: EmailStr):

    print(email)

    raise bad_id(item='User', id=12)
    raise bad_auth

    return {'ok': True}, 402


@router.get('/gcb/', response_class=RedirectResponse)
async def google_callback(request: Request, response: Response):
    next = request.query_params.get('state', '/')
    code = request.query_params.get('code')
    error = request.query_params.get('error')

    if error:
        return '/?error=invalid_login&google_error=' + error

    result = httpx.post(
        'https://oauth2.googleapis.com/token',
        data={
            'client_id': settings.google_client_id,
            'client_secret': settings.google_client_secret,
            'redirect_uri': settings.google_redirect_uri,
            'code': code,
            'grant_type': 'authorization_code',
        }
    )

    if result.status_code != 200:
        return '/?error=invalid_login'

    result = result.json()
    access_token = result.get('access_token')

    result = httpx.get(
        'https://www.googleapis.com/userinfo/v2/me',
        headers={'Authorization': 'Bearer ' + access_token},
        timeout=30
    )

    if result.status_code != 200:
        return '/?error=invalid_login'

    result = result.json()

    if not result.get('verified_email'):
        return '/?error=invalid_login'

    id_token = await update_user(result)
    response.set_cookie(
        key='Authorization',
        value=f'Bearer {id_token}',
        secure=True,
        samesite='strict',
        max_age=30 * 24 * 3600  # 1 month
    )

    return next
