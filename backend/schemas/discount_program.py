from datetime import datetime
from pydantic import BaseModel, field_validator


class DiscountProgramCreate(BaseModel):
    name: str
    min_completed_orders: int
    discount_percent: float
    is_active: bool = True

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Название не может быть пустым")
        return v

    @field_validator("min_completed_orders")
    @classmethod
    def min_orders_positive(cls, v: int) -> int:
        if v < 1:
            raise ValueError("Минимальное количество заказов должно быть >= 1")
        return v

    @field_validator("discount_percent")
    @classmethod
    def discount_in_range(cls, v: float) -> float:
        if not (0 < v <= 100):
            raise ValueError("Скидка должна быть от 0.1 до 100")
        return v


class DiscountProgramUpdate(BaseModel):
    name: str | None = None
    min_completed_orders: int | None = None
    discount_percent: float | None = None
    is_active: bool | None = None


class DiscountProgramOut(BaseModel):
    id: int
    name: str
    min_completed_orders: int
    discount_percent: float
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
