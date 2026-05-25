from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Text, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from database import Base


class PlacementStatus(str, enum.Enum):
    scheduled = "scheduled"
    live = "live"
    completed = "completed"
    cancelled = "cancelled"


class ContentType(str, enum.Enum):
    image = "image"
    video = "video"
    text = "text"
    carousel = "carousel"
    story = "story"


class ContentStatus(str, enum.Enum):
    draft = "draft"
    review = "review"
    approved = "approved"
    published = "published"
    archived = "archived"


class AdPlacement(Base):
    __tablename__ = "ad_placements"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=False)
    channel_id = Column(Integer, ForeignKey("media_channels.id"), nullable=False)
    scheduled_at = Column(DateTime(timezone=True), nullable=False)
    duration_seconds = Column(Integer, nullable=True)
    position = Column(String, nullable=True)
    cost_per_slot = Column(Float, nullable=False, default=0.0)
    status = Column(Enum(PlacementStatus), nullable=False, default=PlacementStatus.scheduled)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    campaign = relationship("Campaign")
    channel = relationship("MediaChannel")


class ContentCalendarEntry(Base):
    __tablename__ = "content_calendar"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=False)
    title = Column(String, nullable=False)
    content_type = Column(Enum(ContentType), nullable=False)
    scheduled_date = Column(Date, nullable=False)
    status = Column(Enum(ContentStatus), nullable=False, default=ContentStatus.draft)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    campaign = relationship("Campaign")
