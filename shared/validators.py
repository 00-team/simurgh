
from typing import Annotated

from pydantic import AfterValidator, WithJsonSchema

from shared import settings
from shared.tools import isallnum


def code_validator(value: str):
    if not isinstance(value, str):
        raise TypeError('string required')

    if len(value) != settings.verification_code_len:
        raise ValueError('invalid code length')

    if not isallnum(value):
        raise ValueError('invalid code')

    return value


VerificationCode = Annotated[
    str,
    AfterValidator(code_validator),
    WithJsonSchema({
        'type': 'string',
        'minLength': 5,
        'maxLength': 5,
        'example': '99999'
    }),
]


def phone_validator(value: str):
    if not isinstance(value, str):
        raise TypeError('string required')

    if len(value) != 11:
        raise ValueError('invalid phone number length')

    if value[:2] != '09' or not isallnum(value):
        raise ValueError('invalid phone number')

    return value


PhoneNumber = Annotated[
    str,
    AfterValidator(phone_validator),
    WithJsonSchema({
        'type': 'string',
        'minLength': 11,
        'maxLength': 11,
        'example': '09223334444'
    }),
]
