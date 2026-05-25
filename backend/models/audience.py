from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Text, Table
from sqlalchemy.sql import func
import enum

from database import Base


campaign_audience_segments = Table(
    "campaign_audience_segments",
    Base.metadata,
    Column("campaign_id", Integer, ForeignKey("campaigns.id"), primary_key=True),
    Column("segment_id", Integer, ForeignKey("audience_segments.id"), primary_key=True),
)


class Gender(str, enum.Enum):
    male = "male"
    female = "female"
    all = "all"


class IncomeLevel(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    ultra_high = "ultra_high"


class AudienceSegment(Base):
    __tablename__ = "audience_segments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    age_min = Column(Integer, nullable=True)
    age_max = Column(Integer, nullable=True)
    gender = Column(Enum(Gender), nullable=False, default=Gender.all)
    interests = Column(Text, nullable=True)
    geography = Column(String, nullable=True)
    income_level = Column(Enum(IncomeLevel), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
