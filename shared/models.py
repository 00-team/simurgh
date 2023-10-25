

from pydantic import BaseModel


class NotificationModel(BaseModel):
    subject: str
    content: str = ''
    show_notification: bool = True


class IDModel(BaseModel):
    id: int
