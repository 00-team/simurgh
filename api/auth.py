

from fastapi import APIRouter, Request, Response
from pydantic import BaseModel, EmailStr
from sqlalchemy import insert, update

from api.verification import Action, verify_verification
from db.models import UserModel, UserTable
from deps import rate_limit
from shared import sqlx
from shared.locale import err_bad_verification
from shared.tools import new_token
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

    result = await sqlx.fetch_one(
        'SELECT * FROM user WHERE email == :email',
        {'email': body.email}
    )
    if result is not None:
        user = UserModel(**result)
        await sqlx.execute(
            update(UserTable).where(UserTable.user_id == user.user_id),
            {'token': hash_token}
        )
    else:
        new_user = True
        user = UserModel(
            user_id=0,
            name='default name',
            email=body.email,
            token=hash_token
        )
        user_id = await sqlx.execute(
            insert(UserTable),
            user.dict(exclude={'user_id'})
        )
        user.user_id = user_id

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
