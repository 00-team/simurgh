

from pydantic import BaseModel


class OkModel(BaseModel):
    ok: bool


class IDModel(BaseModel):
    id: int
