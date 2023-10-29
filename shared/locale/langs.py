
import json
from pathlib import Path
from typing import Literal

from fastapi import Request
from pydantic import BaseModel, conlist

from shared import config


class Lang(BaseModel):
    name: str
    en_name: str
    emoji: str
    direction: Literal['ltr', 'rtl']
    errors: dict[int, conlist(str, min_length=1)]
    messages: dict[str, conlist(str, min_length=1)]


class MessageModel(BaseModel):
    subject: str
    content: str = ''


class MessageResult(BaseModel):
    message: MessageModel


class Messages(dict):
    def __call__(self, request: Request = None, lang: str = config.lang):
        if request is not None:
            lang = request.cookies.get('lang', lang)

        if lang not in self:
            lang = config.lang

        return self[lang]


all_langs: dict[str, Lang] = {}

for p in Path(__file__).parent.glob('*.json'):
    with open(p, 'r') as f:
        all_langs[p.stem] = Lang(**json.load(f))


assert config.lang in all_langs
