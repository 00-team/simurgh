
import logging
from dataclasses import dataclass
from email.mime.text import MIMEText
from enum import Enum
from random import choices
from struct import Struct

from pydantic import BaseModel, EmailStr

from shared import config, email_server, redis, settings
from shared.letters import bad_verification

NS = 'verification'


class Action(str, Enum):
    login = 'login'
    delete = 'delete'


@dataclass
class Value:
    tries: int
    code: str
    action: str

    _struct = Struct('<B5s25s')

    @classmethod
    def from_bytes(cls, data):
        t, c, a = cls._struct.unpack(data)
        return cls(
            tries=t,
            code=c.decode(),
            action=a.strip(b'\x00').decode(),
        )

    def to_bytes(self):
        return self._struct.pack(
            self.tries,
            self.code.encode(),
            self.action.encode(),
        )


class VerificationResponse(BaseModel):
    expires: int
    action: Action

    class Config:
        json_schema_extra = {'example': {
            'expires': 102,
            'action': Action.login
        }}


class VerificationData(BaseModel):
    email: EmailStr
    action: Action


def send_email_code(email: str, code: str):
    msg = MIMEText(f'your login code is: {code}')
    msg['Subject'] = '00 Team Login Code'
    msg['from'] = settings.gmail
    msg['To'] = email

    email_server.sendmail(settings.gmail, [email], msg.as_string())


async def verification(data: VerificationData):
    key = f'{NS}:{data.email}'
    result = await redis.get(key)

    if result:
        value = Value.from_bytes(result)
        if value.action != data.action:
            logging.warn((
                'two verifications with different action\n'
                f'email: {data.email}\n'
            ))
            raise bad_verification

        return VerificationResponse(
            expires=await redis.ttl(key),
            action=value.action
        )

    code = ''.join(choices('0123456789', k=config.verification_code_len))

    value = Value(0, code, data.action)

    await redis.set(
        key, value.to_bytes(),
        config.verification_expire, nx=True
    )

    send_email_code(data.email, code)

    return VerificationResponse(
        expires=config.verification_expire,
        action=value.action
    )


async def verify_verification(email, code, action) -> Value:
    key = f'{NS}:{email}'
    result = await redis.get(key)

    if not result:
        raise bad_verification

    value = Value.from_bytes(result)
    if value.action != action:
        raise bad_verification

    if code == value.code:
        await redis.delete(key)
        return value

    if settings.debug and code == '99999':
        await redis.delete(key)
        return value

    value.tries += 1
    if value.tries > 2:
        await redis.delete(key)
    else:
        await redis.set(key, value.to_bytes(), xx=True, keepttl=True)

    raise bad_verification
