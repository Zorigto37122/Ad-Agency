from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel

from models.placement import PlacementStatus, ContentType, ContentStatus


class AdPlacementCreate(BaseModel):
    campaign_id: int
    channel_id: int
    scheduled_at: datetime
    duration_seconds: Optional[int] = None
    position: Optional[str] = None
    cost_per_slot: float = 0.0
    notes: Optional[str] = None


class AdPlacementUpdate(BaseModel):
    scheduled_at: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    position: Optional[str] = None
    cost_per_slot: Optional[float] = None
    status: Optional[PlacementStatus] = None
    notes: Optional[str] = None


class AdPlacementOut(BaseModel):
    id: int
    campaign_id: int
    channel_id: int
    scheduled_at: datetime
    duration_seconds: Optional[int]
    position: Optional[str]
    cost_per_slot: float
    status: PlacementStatus
    notes: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class ContentCalendarCreate(BaseModel):
    campaign_id: int
    title: str
    content_type: ContentType
    scheduled_date: date
    notes: Optional[str] = None


class ContentCalendarUpdate(BaseModel):
    title: Optional[str] = None
    content_type: Optional[ContentType] = None
    scheduled_date: Optional[date] = None
    status: Optional[ContentStatus] = None
    notes: Optional[str] = None


class ContentCalendarOut(BaseModel):
    id: int
    campaign_id: int
    title: str
    content_type: ContentType
    scheduled_date: date
    status: ContentStatus
    notes: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = {"from_attributes": True}
