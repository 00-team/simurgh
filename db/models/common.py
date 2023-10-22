

from pydantic import BaseModel
from sqlalchemy import MetaData
from sqlalchemy.ext.declarative import declarative_base

metadata = MetaData()
BaseTable = declarative_base(metadata=metadata)


def model_dict(data: BaseModel | dict) -> dict:
    if isinstance(data, BaseModel):
        return data.dict()

    return data
