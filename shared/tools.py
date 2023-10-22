
import string
from datetime import datetime
from hashlib import sha3_512
from random import choices
from secrets import choice as secret_choice

from shared import settings


def utc_now(as_datetime: bool = False) -> int | datetime:
    now = datetime.utcnow()

    if as_datetime:
        return now

    return int(now.timestamp())


def get_random_code() -> str:
    return ''.join(choices('0123456789', k=settings.verification_code_len))


def get_random_string(len=12) -> str:
    return ''.join(choices(string.ascii_letters + string.digits, k=len))


def new_token() -> tuple[str, str]:
    token = ''.join(
        secret_choice(settings.token_abc)
        for _ in range(settings.token_len)
    )
    return token, sha3_512(token.encode()).hexdigest()


def isallnum(text: str) -> bool:
    for c in text:
        if c not in set('0123456789'):
            return False

    return True
