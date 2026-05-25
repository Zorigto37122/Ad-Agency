from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from typing import Optional

from database import Base



class OrderStatus(str, enum.Enum):
    pending = "pending"
    in_progress = "in_progress"
    done = "done"
    cancelled = "cancelled"
    overdue = "overdue"


class ServiceType(str, enum.Enum):
    web_design = "web_design"
    graphic_design = "graphic_design"
    social_media_campaign = "social_media_campaign"
    video_production = "video_production"
    copywriting = "copywriting"


class ScopeType(str, enum.Enum):
    small = "small"
    medium = "medium"
    large = "large"


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    service_type = Column(Enum(ServiceType), nullable=False)
    scope = Column(Enum(ScopeType), nullable=False, default=ScopeType.medium)
    status = Column(Enum(OrderStatus), nullable=False, default=OrderStatus.pending)
    base_price = Column(Float, nullable=False)
    scope_multiplier = Column(Float, nullable=False, default=1.0)
    discount_percent = Column(Float, nullable=False, default=0.0)
    final_price = Column(Float, nullable=False)
    deadline = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    discount_program_id = Column(Integer, ForeignKey("discount_programs.id"), nullable=True)
    attachment_filename = Column(String, nullable=True)
    attachment_path = Column(String, nullable=True)

    client = relationship("Client", back_populates="orders")
    created_by = relationship("User")
    discount_program = relationship("DiscountProgram")

    @property
    def discount_name(self) -> Optional[str]:
        return self.discount_program.name if self.discount_program else None
