
import logging
from typing import Literal

from fastapi import APIRouter, Request
from pydantic import BaseModel, EmailStr, Field, constr

from db.models import UserModel
from db.user import user_update
from deps import rate_limit, user_required
from shared.letters import Letter
# from shared.errors import no_change
from shared.models import OkModel

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
    email: EmailStr | Literal[-1] = None
    name: constr(
        strip_whitespace=True,
        max_length=128,
        min_length=1,
        strict=True
    ) = Field(None, examples=['Patrick Star', 'Mr Krabs'])


@router.patch(
    '/update/', response_model=OkModel,
    openapi_extra={'errors': []}
)
async def update(request: Request, body: UpdateBody):
    user: UserModel = request.state.user
    change = False

    if body.email is None and body.name is None:
        raise no_change

    patch = {}
    if body.email is not None:
        if body.email == -1:
            body.email = None

        if body.email != user.email:
            patch['email'] = body.email
            change = True

    if body.name is not None and body.name != user.name:
        patch['name'] = body.name
        change = True

    if not change:
        raise no_change

    await user_update(**patch)
    return {'ok': True}


class ContactBody(BaseModel):
    subject: str
    content: str


@router.post('/contact/', dependencies=[rate_limit('user:contact', 3600, 1)])
async def contact(request: Request, body: ContactBody):
    user: UserModel = request.state.user

    print(user, body)

    return {'ok': True}
