
from pydantic import BaseModel
from sqlalchemy import JSON, Column, Integer

from .common import BaseTable
from .record import RecordData


class GeneralTable(BaseTable):
    __tablename__ = 'general'

    general_id = Column(Integer, primary_key=True)


class CommonCardModel(BaseModel):
    title: str
    description: str
    image: RecordData


EduCardModel = CommonCardModel


class GeneralModel(BaseModel):
    general_id: int
    why_us: list[CommonCardModel]
    why_cyprus: list[CommonCardModel]
    edu_cyprus: list[EduCardModel]


DEFAULT_GENERAL = GeneralModel(
    general_id=0,
    why_us=[],
    why_cyprus=[],
    edu_cyprus=[]
)
