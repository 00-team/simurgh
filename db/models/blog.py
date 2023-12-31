

from pydantic import BaseModel
from sqlalchemy import JSON, Column, ForeignKey, Integer, String
from sqlalchemy import UniqueConstraint

from db.models.project import ProjectTable
from db.models.record import RecordTable
from db.models.user import UserTable

from .common import BaseTable


class BlogCategoryTable(BaseTable):
    __tablename__ = 'blog_category'

    category_id = Column(Integer, primary_key=True, autoincrement=True)
    project = Column(
        Integer,
        ForeignKey(ProjectTable.project_id, ondelete='CASCADE'),
        nullable=False
    )
    slug = Column(String, nullable=False, index=True)
    label = Column(JSON, nullable=False, server_default='{}')
    __table_args__ = (
        UniqueConstraint('project', 'slug'),
    )


class BlogCategoryModel(BaseModel):
    category_id: int
    project: int
    slug: str
    label: dict[str, str]


class BlogTable(BaseTable):
    __tablename__ = 'blog'

    blog_id = Column(Integer, primary_key=True, autoincrement=True)
    slug = Column(String, nullable=False, index=True)
    project = Column(
        Integer,
        ForeignKey(ProjectTable.project_id, ondelete='CASCADE'),
        nullable=False
    )
    author = Column(
        Integer,
        ForeignKey(UserTable.user_id, ondelete='SET NULL'),
        index=True,
    )
    category = Column(
        Integer,
        ForeignKey(BlogCategoryTable.category_id, ondelete='SET NULL'),
        index=True,
    )
    created_at = Column(Integer, nullable=False, server_default='0')
    edited_at = Column(Integer, nullable=False, server_default='0')
    thumbnail = Column(
        Integer,
        ForeignKey(RecordTable.record_id, ondelete='SET NULL'),
    )
    thumbnail_url = Column(String)
    read_time = Column(Integer, nullable=False, server_default='0')
    __table_args__ = (
        UniqueConstraint('project', 'slug'),
    )


class BlogModel(BaseModel):
    blog_id: int
    slug: str
    project: int
    created_at: int
    author: int | None = None
    category: int | None = None
    edited_at: int = 0
    thumbnail: int | None = None
    thumbnail_url: str | None = None
    read_time: int = 0


class BlogContentTable(BaseTable):
    __tablename__ = 'blog_content'

    content_id = Column(Integer, primary_key=True, autoincrement=True)
    blog = Column(
        Integer,
        ForeignKey(BlogTable.blog_id, ondelete='CASCADE'),
        nullable=False,
    )
    lang = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    content = Column(String, nullable=False)
    __table_args__ = (
        UniqueConstraint('blog', 'lang'),
    )


class BlogContentModel(BaseModel):
    content_id: int
    blog: int
    lang: str
    title: str
    description: str
    content: str
