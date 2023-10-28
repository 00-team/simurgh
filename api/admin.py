
import json
import mimetypes
import os
from typing import Annotated, ClassVar, Literal

import magic
from fastapi import APIRouter, Form, Request, UploadFile
from pydantic import BaseModel, constr

# from db.models import AdminPerms as AP
# from db.models import ProjectModel, ProjectTable, RecordModel, RecordPublic
# from db.models import RecordTable, UserModel, UserPublic
# from db.project import project_add, project_delete, project_get, project_update
# from db.record import record_add, record_delete, record_exists, record_get
# from db.user import user_exists, user_public
from deps import admin_required
from shared import settings, sqlx
# from shared.errors import bad_file, bad_id, no_change, not_unique
from shared.tools import utc_now

router = APIRouter(
    prefix='/admin',
    tags=['admin'],
    # dependencies=[admin_required(AdminPerms.V_USER)]
)

# @router.get(
#     '/projects/', response_model=list[ProjectModel]
# )
# async def get_projects(request: Request, page: int = 0, q: str = ''):
#     user: UserModel = request.state.user
#     user.admin_assert(AP.V_PROJECT)
#
#     search = ''
#     values = {}
#
#     if q:
#         search = 'WHERE title LIKE :query'
#         values['query'] = '%' + q + '%'
#
#     rows = await sqlx.fetch_all(
#         f'''
#         SELECT * from projects {search}
#         LIMIT {settings.page_size} OFFSET {page * settings.page_size}
#         ''', values
#     )
#
#     result = []
#     for row in rows:
#         args = dict(row)
#         args['features'] = json.loads(args['features'])
#         args['prices'] = json.loads(args['prices'])
#         args['images'] = json.loads(args['images'])
#         result.append(ProjectModel(**args))
#
#     return result
#
#
# @router.get(
#     '/projects/{project_id}/', response_model=ProjectModel,
#     openapi_extra={'errors': [bad_id]}
# )
# async def get_project(request: Request, project_id: int):
#     user: UserModel = request.state.user
#     user.admin_assert(AP.V_PROJECT)
#
#     project = await project_get(project_id)
#     if project is None:
#         raise bad_id('Project', project_id, id=project_id)
#
#     return project
#
#
# class AddProjectModel(ProjectModel):
#     project_id: ClassVar
#
#
# @router.post(
#     '/projects/', response_model=ProjectModel
# )
# async def add_project(request: Request, body: AddProjectModel):
#     user: UserModel = request.state.user
#     user.admin_assert(AP.A_PROJECT)
#
#     args = body.dict()
#     project_id = await project_add(**args)
#
#     return ProjectModel(project_id=project_id, **args)
#
#
# @router.put(
#     '/projects/', response_model=OkModel,
#     openapi_extra={'errors': [bad_id]}
# )
# async def update_project(request: Request, body: ProjectModel):
#     user: UserModel = request.state.user
#     user.admin_assert(AP.C_PROJECT)
#
#     args = body.dict()
#     project_id = args.pop('project_id')
#
#     project = await project_get(project_id)
#     if project is None:
#         raise bad_id('Project', project_id, id=project_id)
#
#     await project_update(project_id, **args)
#
#
#
# @router.delete(
#     '/projects/{project_id}/', response_model=OkModel,
#     openapi_extra={'errors': [bad_id]}
# )
# async def delete_project(request: Request, project_id: int, del_imgs: bool):
#     user: UserModel = request.state.user
#     user.admin_assert(AP.D_PROJECT)
#
#     project = await project_get(project_id)
#     if project is None:
#         raise bad_id('Project', project_id, id=project_id)
#
#     if not del_imgs:
#         return {'ok': bool(await project_delete(project_id))}
#
#     for v in project.images.dict().values():
#         record = await record_get(v['id'])
#         if record:
#             record.path.unlink(True)
#             await record_delete(record.record_id)
#
#     return {'ok': bool(await project_delete(project_id))}
#
#
# @router.delete(
#     '/records/{record_id}/', response_model=OkModel,
#     openapi_extra={'errors': [bad_id]}
# )
# async def delete_record(request: Request, record_id: int):
#     user: UserModel = request.state.user
#     user.admin_assert(AP.D_RECORD)
#
#     record = await record_get(record_id)
#     if record is None:
#         raise bad_id('Record', record_id, id=record_id)
#
#     record.path.unlink(True)
#
#     return {'ok': bool(await record_delete(record_id))}
#
#
# @router.post(
#     '/records/', response_model=RecordPublic,
#     openapi_extra={'errors': [bad_file]}
# )
# async def add_record(request: Request, file: UploadFile):
#     user: UserModel = request.state.user
#     user.admin_assert(AP.A_RECORD)
#
#     mime = magic.from_buffer(file.file.read(2048), mime=True)
#     if mime is None:
#         raise bad_file
#
#     ext = mimetypes.guess_extension(mime)
#     if ext is None or len(ext) < 2:
#         raise bad_file
#
#     if file.size > 40 * 1024 * 1024:
#         raise bad_file
#
#     file.file.seek(0)
#     record = RecordModel(
#         record_id=0,
#         salt=os.urandom(4),
#         owner=user.user_id,
#         size=file.size,
#         mime=mime,
#         ext=ext[1:],
#         timestamp=utc_now(),
#     )
#
#     args = record.dict()
#     args.pop('record_id')
#
#     record_id = await record_add(**args)
#     record.record_id = record_id
#
#     path = settings.record_dir / (record.name + ext)
#     with open(path, 'wb') as f:
#         while (chunk := file.file.read(1024)):
#             f.write(chunk)
#
#     return record.public(
#         UserPublic(user_id=user.user_id, name=user.name)
#     )
#
#
# @router.get(
#     '/records/', response_model=list[RecordPublic],
# )
# async def get_records(request: Request, page: int = 0):
#     user: UserModel = request.state.user
#     user.admin_assert(AP.V_RECORD)
#
#     rows = await sqlx.fetch_all(
#         f'''
#         SELECT * from records
#         LIMIT {settings.page_size} OFFSET {page * settings.page_size}
#         '''
#     )
#
#     user_ids = set()
#     records = []
#
#     for row in rows:
#         record = RecordModel(**row)
#         records.append(record)
#         user_ids.add(record.owner)
#
#     owners = await user_public(user_ids)
#     result = []
#
#     for record in records:
#         result.append(record.public(
#             owners[record.owner]
#         ))
#
#     return result
