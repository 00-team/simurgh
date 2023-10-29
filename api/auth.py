
import hashlib

import httpx
from fastapi import APIRouter, Request, Response
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, EmailStr

from api.verification import Action, verify_verification
from db.models import UserModel, UserTable
from db.user import user_add, user_get, user_update
from deps import rate_limit
from shared import settings
from shared.locale import err_bad_verification
from shared.tools import get_random_string, new_token
from shared.validators import VerificationCode

router = APIRouter(
    prefix='/auth',
    tags=['auth'],
    dependencies=[rate_limit('auth', 30 * 60, 20, False)]
)


class LoginBody(BaseModel):
    email: EmailStr
    code: VerificationCode


class LoginResult(BaseModel):
    user: UserModel
    token: str
    new_user: bool


@router.post(
    '/login/', response_model=LoginResult,
    openapi_extra={'errors': [err_bad_verification]}
)
async def login(request: Request, response: Response, body: LoginBody):
    await verify_verification(body.email, body.code, Action.login)

    new_user = False
    token, hash_token = new_token()

    user = await user_get(UserTable.email == body.email)
    if user:
        await user_update(
            UserTable.user_id == user.user_id,
            token=hash_token
        )
    else:
        new_user = True
        user_id = await user_add(
            name='default name',
            email=body.email,
            token=hash_token
        )
        user = UserModel(
            user_id=user_id,
            name='default name',
            email=body.email,
            token=hash_token
        )

    id_token = f'{user.user_id}:{token}'
    response.set_cookie(
        key='Authorization',
        value=f'Bearer {id_token}',
        secure=True,
        samesite='strict',
        max_age=30 * 24 * 3600  # 1 month
    )

    user.token = user.token[:32]

    return {
        'user': user,
        'token': id_token,
        'new_user': new_user
    }
