from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel

from models.campaign import CampaignStatus, ChannelType, ReportPeriod


class MediaChannelCreate(BaseModel):
    name: str
    channel_type: ChannelType
    description: Optional[str] = None


class MediaChannelUpdate(BaseModel):
    name: Optional[str] = None
    channel_type: Optional[ChannelType] = None
    description: Optional[str] = None


class MediaChannelOut(BaseModel):
    id: int
    name: str
    channel_type: ChannelType
    description: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class CampaignCreate(BaseModel):
    order_id: int
    name: str
    description: Optional[str] = None
    budget: float = 0.0
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    channel_ids: List[int] = []


class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[CampaignStatus] = None
    budget: Optional[float] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    channel_ids: Optional[List[int]] = None


class CampaignOut(BaseModel):
    id: int
    order_id: int
    name: str
    description: Optional[str]
    status: CampaignStatus
    budget: float
    start_date: Optional[date]
    end_date: Optional[date]
    created_at: datetime
    updated_at: Optional[datetime]
    media_channels: List[MediaChannelOut] = []

    model_config = {"from_attributes": True}


class MetricCreate(BaseModel):
    channel_id: Optional[int] = None
    date: date
    impressions: int = 0
    clicks: int = 0
    conversions: int = 0
    spend: float = 0.0


class MetricOut(BaseModel):
    id: int
    campaign_id: int
    channel_id: Optional[int]
    date: date
    impressions: int
    clicks: int
    ctr: float
    conversions: int
    spend: float
    created_at: datetime

    model_config = {"from_attributes": True}


class ReportCreate(BaseModel):
    period: ReportPeriod
    period_start: date
    period_end: date


class ReportOut(BaseModel):
    id: int
    campaign_id: int
    period: ReportPeriod
    period_start: date
    period_end: date
    total_impressions: int
    total_clicks: int
    avg_ctr: float
    total_conversions: int
    total_spend: float
    generated_at: datetime

    model_config = {"from_attributes": True}
