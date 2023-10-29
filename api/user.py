
import logging
from typing import Literal

from fastapi import APIRouter, Request
from pydantic import BaseModel, EmailStr, Field, constr

from db.models import UserModel
from db.user import user_update
from deps import rate_limit, user_required
from shared.locale import MessageResult, err_no_change, msg_user_update_ok

router = APIRouter(
    prefix='/user',
    tags=['user'],
    dependencies=[user_required(), rate_limit('user', 60, 120)]
)


@router.get('/', response_model=UserModel)
async def get(request: Request):
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
async def update(request: Request, body: UpdateBody):
    user: UserModel = request.state.user

    if body.name == user.name:
        raise err_no_change

    patch = {
        'name': body.name
    }

    await user_update(**patch)

    return {
        'message': msg_user_update_ok(request)
    }
