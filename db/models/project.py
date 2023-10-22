
from pydantic import BaseModel
from sqlalchemy import JSON, Column, Float, Integer, String

from .common import BaseTable
from .record import RecordData


class ProjectTable(BaseTable):
    __tablename__ = 'projects'

    project_id = Column(
        Integer, primary_key=True,
        index=True, autoincrement=True
    )
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    features = Column(JSON, nullable=False, server_default='[]')
    sector = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    payment_terms = Column(String, nullable=False)
    prices = Column(JSON, nullable=False, server_default='[]')
    images = Column(JSON, nullable=False, server_default='{}')


class ImagesModel(BaseModel):
    desc: RecordData
    feat: RecordData
    term: RecordData


class PriceModel(BaseModel):
    layout: str
    area: int
    price: int


class ProjectModel(BaseModel):
    project_id: int
    title: str
    description: str
    features: list[str]
    sector: str
    latitude: float
    longitude: float
    payment_terms: str
    prices: list[PriceModel]
    images: ImagesModel
