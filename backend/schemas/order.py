from datetime import datetime
from typing import Optional
from pydantic import BaseModel

from models.order import OrderStatus, ServiceType, ScopeType


class OrderCreate(BaseModel):
    client_id: int
    title: str
    description: Optional[str] = None
    service_type: ServiceType
    scope: ScopeType = ScopeType.medium
    deadline: Optional[datetime] = None


class OrderUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    service_type: Optional[ServiceType] = None
    scope: Optional[ScopeType] = None
    status: Optional[OrderStatus] = None
    deadline: Optional[datetime] = None


class ClientSummary(BaseModel):
    id: int
    name: str
    email: str
    company: Optional[str]

    model_config = {"from_attributes": True}


class OrderOut(BaseModel):
    id: int
    client_id: int
    created_by_id: Optional[int]
    title: str
    description: Optional[str]
    service_type: ServiceType
    scope: ScopeType
    status: OrderStatus
    base_price: float
    scope_multiplier: float
    discount_percent: float
    discount_program_id: Optional[int] = None
    discount_name: Optional[str] = None
    final_price: float
    deadline: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]
    client: ClientSummary
    attachment_filename: Optional[str] = None

    model_config = {"from_attributes": True}
