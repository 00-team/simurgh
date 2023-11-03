

from fastapi import APIRouter, Request, Response
from pydantic import BaseModel, constr
from sqlalchemy import update

from db.models import UserModel, UserTable
from deps import rate_limit, user_required
from shared import sqlx
from shared.locale import MessageResult, err_no_change

router = APIRouter(
    prefix='/user',
    tags=['user'],
    dependencies=[user_required(), rate_limit('user', 60, 120)]
)


@router.get('/', response_model=UserModel)
async def user_get(request: Request):
    user: UserModel = request.state.user
    user.token = user.token[:32]
    return user


class UpdateBody(BaseModel):
    name: constr(
        strip_whitespace=True,
        max_length=128,
        min_length=1,
        strict=True
    )


@router.patch(
    '/update/', response_model=MessageResult,
    openapi_extra={'errors': [err_no_change]}
)
async def user_update(request: Request, body: UpdateBody):
    user: UserModel = request.state.user

    if body.name == user.name:
        raise err_no_change

    patch = {
        'name': body.name
    }

    await sqlx.execute(
        update(UserTable).where(UserTable.user_id == user.user_id),
        patch
    )

    return Response()
