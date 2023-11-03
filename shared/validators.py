
import string
from typing import Annotated

from pydantic import AfterValidator, WithJsonSchema

from shared import config
from shared.tools import isallnum


def code_validator(value: str):
    value = str(value)

    if len(value) != config.verification_code_len:
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
    value = str(value)

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


def lang_validator(value: str):
    value = str(value)

    length = len(value)
    if length < 2 or length > 3:
        raise ValueError(f'invalid lang code length: 1 < {length} < 4')

    for c in value:
        if c not in string.ascii_lowercase:
            raise ValueError(f'invalid character: {c} in {value}')

    return value


LangCode = Annotated[
    str,
    AfterValidator(lang_validator),
    WithJsonSchema({
        'type': 'string',
        'minLength': 2,
        'maxLength': 3,
        'example': config.lang
    }),
]


def slug_validator(value: str):
    value = str(value)

    if not value:
        raise ValueError('slug connot be empty')

    value = value[:255]

    for c in value:
        if c not in string.ascii_letters + string.digits + '-_':
            raise ValueError(f'invalid character {c} in slug')

    return value


Slug = Annotated[
    str,
    AfterValidator(slug_validator),
    WithJsonSchema({
        'type': 'string',
        'minLength': 1,
        'maxLength': 255,
        'example': 'sample'
    }),
]
