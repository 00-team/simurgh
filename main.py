

from hashlib import sha3_256, sha3_512
from io import StringIO

from fastapi import FastAPI, Request, Response
from fastapi.openapi.utils import get_openapi
from fastapi.responses import HTMLResponse, PlainTextResponse
from fastapi.routing import APIRoute
from fastapi.staticfiles import StaticFiles

import api
import shared.logger
from db.models import UserModel, UserTable
from db.user import user_get
from deps import get_ip
from shared import redis, settings, sqlx
from shared.letters import Letter, all_letters

# from shared.errors import Error, all_errors

app = FastAPI(
    title='simurgh',
    version='0.0.1',
    dependencies=[get_ip()]
)


if settings.debug:
    app.mount('/static', StaticFiles(directory='static'), name='static')
    app.mount('/records', StaticFiles(directory='records'), name='records')


app.include_router(api.router)


@app.exception_handler(Letter)
async def error_exception_handler(request: Request, exc: Letter):
    return exc.json(request.cookies.get('lang'))


@app.on_event('startup')
async def startup():
    await redis.ping()
    await sqlx.connect()


@app.on_event('shutdown')
async def shutdown():
    await redis.connection_pool.disconnect()
    await sqlx.disconnect()


@app.get('/rapidoc/', response_class=HTMLResponse, include_in_schema=False)
async def rapidoc(response: Response):
    return '''<!doctype html>
    <html><head><meta charset="utf-8">
    <meta name="robots" content="noindex">
    <script type="module" src="/static/rapidoc.js"></script></head><body>
    <rapi-doc spec-url="/openapi.json" persist-auth="true"
    bg-color="#040404" text-color="#f2f2f2" header-color="#040404"
    primary-color="#ff8800" nav-text-color="#eee" font-size="largest"
    allow-spec-url-load="false" allow-spec-file-load="false"
    show-method-in-nav-bar="as-colored-block" response-area-height="500px"
    show-header="false" /></body> </html>'''


for route in app.routes:
    if not isinstance(route, APIRoute):
        continue

    letters = []

    for d in route.dependencies:
        letters.extend(getattr(d, 'letters', []))

    oid = route.path.replace('/', '_').strip('_')
    oid += '_' + '_'.join(route.methods)
    route.operation_id = oid

    letters.extend((route.openapi_extra or {}).pop('letters', []))

    for l in letters:
        route.responses[l.code] = {
            'description': f'hi',
            'content': {
                'application/json': {
                    'schema': {
                        '$ref': f'#/letters/{l.code}',
                    }
                }
            }
        }


def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )

    schema['letters'] = {}

    for l in all_letters:
        schema['letters'][l.code] = l.schema

    app.openapi_schema = schema
    return app.openapi_schema


app.openapi = custom_openapi
