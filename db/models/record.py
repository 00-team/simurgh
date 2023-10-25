
from functools import cached_property
from hashlib import sha3_256
from pathlib import Path

from pydantic import BaseModel
from sqlalchemy import BLOB, Column, Integer, String, text

from db.models.user import UserPublic
from shared import config

from .common import BaseTable


class RecordTable(BaseTable):
    __tablename__ = 'records'

    record_id = Column(
        Integer, primary_key=True,
        index=True, autoincrement=True
    )
    salt = Column(BLOB, nullable=False)
    owner = Column(
        Integer, nullable=False,
        index=True, server_default=text('-1')
    )
    size = Column(Integer, nullable=False, server_default=text('0'))
    mime = Column(String, nullable=False, server_default='unknown')
    ext = Column(String, nullable=False)
    timestamp = Column(Integer, nullable=False, server_default=text('0'))


class RecordPublic(BaseModel):
    record_id: int
    size: int
    mime: str
    ext: str
    timestamp: int
    url: str
    name: str
    owner: UserPublic


class RecordModel(BaseModel):
    record_id: int
    salt: bytes
    owner: int
    size: int
    mime: str
    ext: str
    timestamp: int

    @cached_property
    def url(self) -> str:
        return f'{config.record_dir.name}/{self.name}.{self.ext}'

    @cached_property
    def name(self) -> str:
        return sha3_256(
            self.record_id.to_bytes(12, byteorder='little') + self.salt
        ).hexdigest()

    @cached_property
    def path(self) -> Path:
        return config.record_dir / (self.name + '.' + self.ext)

    def public(self, owner: UserPublic) -> RecordPublic:
        return RecordPublic(
            record_id=self.record_id,
            size=self.size,
            mime=self.mime,
            ext=self.ext,
            timestamp=self.timestamp,
            url=self.url,
            name=self.name,
            owner=owner,
        )


class RecordData(BaseModel):
    id: int
    url: str
