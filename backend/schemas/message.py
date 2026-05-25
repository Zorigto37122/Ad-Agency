from datetime import datetime
from pydantic import BaseModel, field_validator


class MessageCreate(BaseModel):
    subject: str
    body: str

    @field_validator("subject")
    @classmethod
    def subject_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Тема не может быть пустой")
        return v

    @field_validator("body")
    @classmethod
    def body_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Сообщение не может быть пустым")
        return v


class MessageOut(BaseModel):
    id: int
    user_id: int
    user_name: str
    user_email: str
    subject: str
    body: str
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}
