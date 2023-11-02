
from pydantic import BaseModel
from sqlalchemy import Column, ForeignKey, Integer, String

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
    storage = Column(Integer, nullable=False, server_default='0')
    blogs = Column(Integer, nullable=False, server_default='0')
    records = Column(Integer, nullable=False, server_default='0')
    created_at = Column(Integer, nullable=False, server_default='0')
    edited_at = Column(Integer, nullable=False, server_default='0')
    api_key = Column(String)


class ProjectModel(BaseModel):
    project_id: int
    creator: int
    name: str
    storage: int
    blogs: int
    records: int
    created_at: int
    edited_at: int
    api_key: str | None = None
