from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class VariantCreate(BaseModel):
    name: str
    description: Optional[str] = None
    material_url: Optional[str] = None


class VariantUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    material_url: Optional[str] = None
    impressions: Optional[int] = None
    conversions: Optional[int] = None
    is_winner: Optional[bool] = None


class VariantOut(BaseModel):
    id: int
    campaign_id: int
    name: str
    description: Optional[str]
    material_url: Optional[str]
    impressions: int
    conversions: int
    conversion_rate: float
    is_winner: bool
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = {"from_attributes": True}
