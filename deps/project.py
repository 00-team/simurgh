

from fastapi import Depends, Request
from sqlalchemy import select

from db.models import ProjectModel, ProjectTable, UserModel
from deps.auth import user_required
from shared import sqlx
from shared.locale import err_bad_id, err_forbidden


def project_required():
    async def inner(
        request: Request, project_id: int,
        user: UserModel = user_required()
    ):
        if not user.client:
            raise err_forbidden

        project: ProjectModel = getattr(request.state, 'project', None)
        if project is not None and project.project_id == project_id:
            if project.creator == user.user_id:
                return project
            else:
                raise err_bad_id(item='project', id=project_id)

        result = await sqlx.fetch_one(select(ProjectTable).where(
            ProjectTable.project_id == project_id,
            ProjectTable.creator == user.user_id
        ))
        if result is None:
            raise err_bad_id(item='project', id=project_id)

        project = ProjectModel(**result)

        request.state.project = project
        return project

    dep = Depends(inner)
    dep.errors = [err_bad_id, err_forbidden]
    return dep
