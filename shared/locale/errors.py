
from fastapi.responses import JSONResponse

from shared.locale.langs import Messages, all_langs


class Error(Exception):
    def __init__(
        self, code: int, messages: Messages,
        status=400, headers={}, extra: dict = None,
    ):

        self.code = code
        self.messages = messages
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
                **self.messages()
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
            if isinstance(v, str):
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

    def json(self, lang: str = None):
        data = {
            'status': self.status,
            'code': self.code,
            **(self.messages(lang=lang)).format(**(self.extra or {})),
        }

        if self.extra:
            data['extra'] = self.extra

        return JSONResponse(
            status_code=self.status,
            content=data,
            headers=self.headers
        )

    def __call__(self, *, headers={}, **kwargs):
        obj = Error(
            code=self.code,
            messages=self.messages,
            status=self.status,
            headers=headers or self.headers,
            extra=kwargs,
        )

        return obj


all_errors = []


def error(code: int, status: int, extra={}):

    if 'headers' in extra:
        raise KeyError('headers cannot be an extra key')

    messages = Messages()

    for k, lang in all_langs.items():
        messages[k] = dict(
            subject=lang.errors[code][0],
            content='\n'.join(lang.errors[code][1:])
        )

    err = Error(
        code=int(code),
        messages=messages,
        status=status,
        extra=extra,
    )
    all_errors.append(err)
    return err


err_bad_verification = error(40002, 403)
err_no_change = error(40003, 400)
err_bad_id = error(40004, 404, {'item': 'User', 'id': 12})
err_bad_auth = error(40005, 403)
err_forbidden = error(40006, 403)
err_rate_limited = error(40007, 429)
err_already_exists = error(40008, 409)
err_bad_args = error(40009, 400)
err_bad_file = error(40013, 400)
err_too_many_projects = error(40101, 400)
err_database_error = error(50001, 500)
