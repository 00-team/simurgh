
import logging
from dataclasses import dataclass
from email.message import EmailMessage
from enum import Enum
from random import choices
from struct import Struct

from fastapi import Request
from pydantic import BaseModel, EmailStr

from shared import config, redis, settings
from shared.errors import bad_verification
from shared.models import NotificationModel
from shared.tools import send_email

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
    notification: NotificationModel


class VerificationData(BaseModel):
    email: EmailStr
    action: Action


already_sent = {
    'en': NotificationModel(
        subject='already sent',
        content='code has been already sent to your email address'
    )
}

code_send = {
    'en': NotificationModel(
        subject='code was send',
        content='a code has been sended to your email address'
    )
}


async def verification(request: Request, data: VerificationData):
    key = f'{NS}:{data.email}'
    result = await redis.get(key)
    lang = request.cookies.get('lang', config.lang)

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
            action=value.action,
            notification=already_sent[lang]
        )

    code = ''.join(choices('0123456789', k=config.verification_code_len))

    value = Value(0, code, data.action)

    await redis.set(
        key, value.to_bytes(),
        config.verification_expire, nx=True
    )

    msg = EmailMessage()
    msg['subject'] = '00 Team Login Code'
    msg['form'] = '00 Team'
    msg['to'] = data.email
    msg.add_alternative(f'your login code is: {code}', 'text')
    msg.add_alternative(
        f'''
        <p>
        your login code is: <span
             style="color: lightblue;font-size:40px"
        >{code}</span>
        </p>
        ''',
        'html'
    )
    send_email(data.email, msg)

    return VerificationResponse(
        expires=config.verification_expire,
        action=value.action,
        notification=code_send[lang]
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
