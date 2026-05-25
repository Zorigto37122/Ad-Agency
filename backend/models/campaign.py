from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Text, Table, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from database import Base


campaign_media_channels = Table(
    "campaign_media_channels",
    Base.metadata,
    Column("campaign_id", Integer, ForeignKey("campaigns.id"), primary_key=True),
    Column("channel_id", Integer, ForeignKey("media_channels.id"), primary_key=True),
)


class CampaignStatus(str, enum.Enum):
    draft = "draft"
    active = "active"
    paused = "paused"
    completed = "completed"
    cancelled = "cancelled"


class ChannelType(str, enum.Enum):
    social_media = "social_media"
    search = "search"
    display = "display"
    video = "video"
    email = "email"
    outdoor = "outdoor"


class ReportPeriod(str, enum.Enum):
    daily = "daily"
    weekly = "weekly"
    monthly = "monthly"


class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(Enum(CampaignStatus), nullable=False, default=CampaignStatus.draft)
    budget = Column(Float, nullable=False, default=0.0)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    order = relationship("Order")
    media_channels = relationship("MediaChannel", secondary=campaign_media_channels, back_populates="campaigns")
    metrics = relationship("CampaignMetric", back_populates="campaign", cascade="all, delete-orphan")
    reports = relationship("CampaignReport", back_populates="campaign", cascade="all, delete-orphan")


class MediaChannel(Base):
    __tablename__ = "media_channels"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    channel_type = Column(Enum(ChannelType), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    campaigns = relationship("Campaign", secondary=campaign_media_channels, back_populates="media_channels")
    metrics = relationship("CampaignMetric", back_populates="channel")


class CampaignMetric(Base):
    __tablename__ = "campaign_metrics"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=False)
    channel_id = Column(Integer, ForeignKey("media_channels.id"), nullable=True)
    date = Column(Date, nullable=False)
    impressions = Column(Integer, nullable=False, default=0)
    clicks = Column(Integer, nullable=False, default=0)
    ctr = Column(Float, nullable=False, default=0.0)
    conversions = Column(Integer, nullable=False, default=0)
    spend = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    campaign = relationship("Campaign", back_populates="metrics")
    channel = relationship("MediaChannel", back_populates="metrics")


class CampaignReport(Base):
    __tablename__ = "campaign_reports"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=False)
    period = Column(Enum(ReportPeriod), nullable=False)
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    total_impressions = Column(Integer, nullable=False, default=0)
    total_clicks = Column(Integer, nullable=False, default=0)
    avg_ctr = Column(Float, nullable=False, default=0.0)
    total_conversions = Column(Integer, nullable=False, default=0)
    total_spend = Column(Float, nullable=False, default=0.0)
    generated_at = Column(DateTime(timezone=True), server_default=func.now())

    campaign = relationship("Campaign", back_populates="reports")
