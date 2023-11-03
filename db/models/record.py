
from hashlib import sha3_256
from pathlib import Path

from pydantic import BaseModel
from sqlalchemy import BLOB, Column, ForeignKey, Integer, String, text

from db.models.project import ProjectTable
from shared import config

from .common import BaseTable


class RecordTable(BaseTable):
    __tablename__ = 'record'

    record_id = Column(
        Integer, primary_key=True,
        index=True, autoincrement=True
    )
    project = Column(
        Integer,
        ForeignKey(ProjectTable.project_id, ondelete='CASCADE'),
        nullable=False
    )
    salt = Column(BLOB, nullable=False)
    size = Column(Integer, nullable=False, server_default=text('0'))
    mime = Column(String, nullable=False, server_default='unknown')
    ext = Column(String, nullable=False)
    timestamp = Column(Integer, nullable=False, server_default=text('0'))


class RecordPublic(BaseModel):
    record_id: int
    project: int
    size: int
    mime: str
    ext: str
    timestamp: int
    url: str
    name: str


class RecordModel(BaseModel):
    record_id: int
    project: int
    salt: bytes
    size: int
    mime: str
    ext: str
    timestamp: int

    @property
    def name(self) -> str:
        return sha3_256(
            self.record_id.to_bytes(12, byteorder='little') + self.salt
        ).hexdigest()

    @property
    def url(self) -> str:
        return f'/{config.record_dir.name}/{self.project}/{self.name}.{self.ext}'

    @property
    def path(self) -> Path:
        return config.record_dir / f'{self.project}/{self.name}.{self.ext}'

    def public(self) -> RecordPublic:
        return RecordPublic(
            record_id=self.record_id,
            project=self.project,
            size=self.size,
            mime=self.mime,
            ext=self.ext,
            timestamp=self.timestamp,
            url=self.url,
            name=self.name,
        )


class RecordData(BaseModel):
    id: int
    url: str
