from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database import Base


class CampaignVariant(Base):
    __tablename__ = "campaign_variants"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    material_url = Column(String, nullable=True)
    impressions = Column(Integer, nullable=False, default=0)
    conversions = Column(Integer, nullable=False, default=0)
    is_winner = Column(Boolean, nullable=False, default=False, server_default="0")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    campaign = relationship("Campaign")

    @property
    def conversion_rate(self) -> float:
        if self.impressions == 0:
            return 0.0
        return round(self.conversions / self.impressions * 100, 4)
