
import smtplib
import string
from datetime import datetime
from email.message import EmailMessage
from hashlib import sha3_512
from random import choices
from secrets import choice as secret_choice

from shared import config, settings


def utc_now(as_datetime: bool = False) -> int | datetime:
    now = datetime.utcnow()

    if as_datetime:
        return now

    return int(now.timestamp())


def send_email(to: str, message: EmailMessage):
    with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
        server.login(settings.gmail, settings.gmail_pass)
        server.sendmail(settings.gmail, [to], str(message))


def get_random_code() -> str:
    return ''.join(choices('0123456789', k=config.verification_code_len))


def get_random_string(len=12) -> str:
    return ''.join(choices(string.ascii_letters + string.digits, k=len))


def new_token() -> tuple[str, str]:
    token = ''.join(
        secret_choice(config.token_abc)
        for _ in range(config.token_len)
    )
    return token, sha3_512(token.encode()).hexdigest()


def isallnum(text: str) -> bool:
    for c in text:
        if c not in set('0123456789'):
            return False

    return True
