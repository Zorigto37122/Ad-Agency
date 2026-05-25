from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from sqlalchemy.sql import func

from database import Base


class DiscountProgram(Base):
    __tablename__ = "discount_programs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    min_completed_orders = Column(Integer, nullable=False)
    discount_percent = Column(Float, nullable=False)
    is_active = Column(Boolean, nullable=False, default=True, server_default="1")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
