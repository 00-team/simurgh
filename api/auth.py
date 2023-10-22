
import hashlib

import httpx
from fastapi import APIRouter, Request, Response
from fastapi.responses import RedirectResponse

from db.models import UserModel, UserTable
from db.user import user_add, user_get, user_update
from deps import rate_limit
from shared import settings
from shared.tools import get_random_string, new_token

router = APIRouter(
    prefix='/auth',
    tags=['auth'],
    dependencies=[rate_limit('auth', 30 * 60, 20, False)]
)


def download_picture(url: str, user: UserModel):
    if user.picture:
        filename = user.picture
    else:
        filename = hashlib.sha3_256(
            f'{user.user_id}:{get_random_string(12)}'.encode('utf-8')
        ).hexdigest() + '.jpg'

    with open(settings.user_picture_dir / filename, 'wb') as media:
        with httpx.stream('GET', url) as result:
            for chunk in result.iter_bytes():
                media.write(chunk)

    return filename


async def update_user(data: dict):
    email = data.get('email')
    name = data.get('name')
    picture = data.get('picture').replace('=s96-c', '=s512-c')

    created = False
    token, token_hash = new_token()

    user = await user_get(UserTable.email == email)
    if user:
        user_id = user.user_id
        await user_update(
            UserTable.user_id == user_id,
            name=name,
            token=token_hash
        )
    else:
        created = True
        user_id = await user_add(
            email=email,
            name=name,
            token=token_hash
        )
        user = UserModel(user_id=user_id, name=name, email=email)

    picture_filename = download_picture(picture, user)

    if created or not user.picture:
        await user_update(
            UserTable.user_id == user.user_id,
            picture=picture_filename
        )

    return f'{user.user_id}:{token}'


@router.get('/login/')
async def login(request: Request, next: str = '/dash/'):
    url = httpx.URL(
        'https://accounts.google.com/o/oauth2/v2/auth',
        params={
            'client_id': settings.google_client_id,
            'redirect_uri': settings.google_redirect_uri,
            'response_type': 'code',
            'scope': ' '.join([
                'https://www.googleapis.com/auth/userinfo.email',
                'https://www.googleapis.com/auth/userinfo.profile',
                # 'openid',
            ]),
            'access_type': 'online',
            'prompt': 'select_account',
            'state': next
        }
    )

    return RedirectResponse(url)


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
