
from pydantic import BaseModel
from sqlalchemy import JSON, Column, Float, ForeignKey, Integer, String

from .common import BaseTable
from .user import UserTable


class ProjectTable(BaseTable):
    __tablename__ = 'projects'

    project_id = Column(
        Integer, primary_key=True,
        index=True, autoincrement=True
    )
    creator = Column(
        Integer,
        ForeignKey(UserTable.user_id, ondelete='CASCADE'),
        nullable=False
    )
    name = Column(String, nullable=False)
    api_key = Column(String)


class ProjectModel(BaseModel):
    project_id: int
    creator: int
    name: str
    api_key: str | None = None
