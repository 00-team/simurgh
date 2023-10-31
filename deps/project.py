

from fastapi import Depends, Request

from db.models import ProjectModel, ProjectTable, UserModel
from db.project import project_get
from deps.auth import user_required
from shared.locale import err_bad_id


def project_required():
    async def inner(
        request: Request, project_id: int,
        user: UserModel = user_required()
    ):
        project: ProjectModel = getattr(request.state, 'project', None)
        if project is not None and project.project_id == project_id:
            if project.creator == user.user_id:
                return project
            else:
                raise err_bad_id(item='Project', id=project_id)

        project = await project_get(
            ProjectTable.project_id == project_id,
            ProjectTable.creator == user.user_id
        )
        if project is None:
            raise err_bad_id(item='Project', id=project_id)

        request.state.project = project
        return project

    dep = Depends(inner)
    dep.errors = [err_bad_id]
    return dep
