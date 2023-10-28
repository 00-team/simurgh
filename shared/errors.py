
import json

from fastapi.responses import JSONResponse

from shared import config


class Error(Exception):
    def __init__(
        self, code: int, message: dict,
        status=400, headers={}, extra: dict = None,
    ):

        self.code = code
        self.message = message
        self.status = status
        self.headers = headers
        self.extra = extra

    @property
    def schema(self):
        scheme = {
            'title': 'Error',
            'type': 'object',
            'required': ['code', 'status', 'subject', 'content'],
            'properties': {
                'code': {'type': 'integer'},
                'status': {'type': 'integer'},
                'subject': {'type': 'string'},
                'content': {'type': 'string'},
            },
            'example': {
                'code': self.code,
                'status': self.status,
                **self.message[config.lang]
            }
        }

        if not self.extra:
            return scheme

        extra = {
            'title': 'Extra',
            'type': 'object',
            'properties': {},
        }

        for k, v in self.extra.items():
            if isinstance(v, (tuple, list)):
                t = 'array'
            elif isinstance(v, dict):
                t = 'object'
            elif isinstance(v, str):
                t = 'string'
            elif isinstance(v, (float, int)):
                t = 'number'
            elif isinstance(v, bool):
                t = 'boolean'
            else:
                t = 'any'

            extra['properties'][k] = {'type': t}

        scheme['properties']['extra'] = extra
        scheme['required'].append('extra')
        scheme['example']['extra'] = self.extra

        return scheme

    def json(self, lang: str = config.lang):
        if lang not in self.message:
            lang = config.lang

        data = {
            'code': self.code,
            **self.message[lang],
        }

        if self.extra:
            data['extra'] = self.extra
            data['subject'] = data['subject'].format(**self.extra)
            data['content'] = data['content'].format(**self.extra)

        return JSONResponse(
            status_code=self.status,
            content=data,
            headers=self.headers
        )

    def __call__(self, *, headers={}, **kwargs):
        obj = Error(
            code=self.code,
            message=self.message,
            status=self.status,
            headers=headers or self.headers,
            extra=kwargs,
        )

        return obj


with open(config.base_dir / 'shared/errors.json', 'r') as f:
    data: dict = json.load(f)


all_errors = []


def error(code):
    code = str(code)

    if not code in data:
        raise KeyError(f'error with code: {code} was not found')

    item: dict = data[code]
    status = item.pop('status', 400)
    extra = item.pop('extra', {})

    if 'headers' in extra:
        raise KeyError('headers cannot be an extra key')

    if config.lang not in item:
        raise ValueError('default lang must be included in errors')

    message = {}

    for k, v in item.items():
        if isinstance(v, str):
            message[k] = {
                'subject': v,
                'content': ''
            }
        elif isinstance(v, list):
            message[k] = {
                'subject': v.pop(0),
                'content': '\n'.join(v),
            }
        else:
            message[k] = {
                'subject': v['subject'],
                'content': v.get('content', '')
            }

    l = Error(
        code=int(code),
        message=message,
        status=status,
        extra=extra,
    )
    all_errors.append(l)
    return l


bad_verification = error(40002)
bad_auth = error(40005)
bad_id = error(40004)
no_change = error(40003)
forbidden = error(40006)
rate_limited = error(40007)
bad_args = error(40009)
bad_file = error(40013)

database_error = error(50001)
