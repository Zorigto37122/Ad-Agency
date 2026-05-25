from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, model_validator

from models.audience import Gender, IncomeLevel


class AudienceSegmentCreate(BaseModel):
    name: str
    age_min: Optional[int] = None
    age_max: Optional[int] = None
    gender: Gender = Gender.all
    interests: Optional[str] = None
    geography: Optional[str] = None
    income_level: Optional[IncomeLevel] = None

    @model_validator(mode="after")
    def age_max_gte_min(self):
        if self.age_min is not None and self.age_max is not None:
            if self.age_max < self.age_min:
                raise ValueError("age_max must be >= age_min")
        return self


class AudienceSegmentUpdate(BaseModel):
    name: Optional[str] = None
    age_min: Optional[int] = None
    age_max: Optional[int] = None
    gender: Optional[Gender] = None
    interests: Optional[str] = None
    geography: Optional[str] = None
    income_level: Optional[IncomeLevel] = None


class AudienceSegmentOut(BaseModel):
    id: int
    name: str
    age_min: Optional[int]
    age_max: Optional[int]
    gender: Gender
    interests: Optional[str]
    geography: Optional[str]
    income_level: Optional[IncomeLevel]
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = {"from_attributes": True}


class CampaignSegmentsUpdate(BaseModel):
    segment_ids: List[int]
