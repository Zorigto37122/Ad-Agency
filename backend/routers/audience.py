from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from core.dependencies import get_db, get_current_user, require_admin
from models.audience import AudienceSegment, campaign_audience_segments, Gender, IncomeLevel
from models.campaign import Campaign
from models.user import User
from schemas.audience import AudienceSegmentCreate, AudienceSegmentUpdate, AudienceSegmentOut, CampaignSegmentsUpdate

router = APIRouter(prefix="/api/segments", tags=["audience"])
campaign_segments_router = APIRouter(tags=["audience"])


@router.get("", response_model=List[AudienceSegmentOut])
def list_segments(
    gender: Optional[Gender] = Query(None),
    income_level: Optional[IncomeLevel] = Query(None),
    geography: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(AudienceSegment)
    if gender:
        q = q.filter(AudienceSegment.gender == gender)
    if income_level:
        q = q.filter(AudienceSegment.income_level == income_level)
    if geography:
        q = q.filter(AudienceSegment.geography.ilike(f"%{geography}%"))
    return q.order_by(AudienceSegment.name).all()


@router.post("", response_model=AudienceSegmentOut, status_code=status.HTTP_201_CREATED)
def create_segment(data: AudienceSegmentCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    seg = AudienceSegment(**data.model_dump())
    db.add(seg)
    db.commit()
    db.refresh(seg)
    return seg


@router.get("/{segment_id}", response_model=AudienceSegmentOut)
def get_segment(segment_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    seg = db.query(AudienceSegment).filter(AudienceSegment.id == segment_id).first()
    if not seg:
        raise HTTPException(status_code=404, detail="Segment not found")
    return seg


@router.put("/{segment_id}", response_model=AudienceSegmentOut)
def update_segment(segment_id: int, data: AudienceSegmentUpdate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    seg = db.query(AudienceSegment).filter(AudienceSegment.id == segment_id).first()
    if not seg:
        raise HTTPException(status_code=404, detail="Segment not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(seg, k, v)
    db.commit()
    db.refresh(seg)
    return seg


@router.delete("/{segment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_segment(segment_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    seg = db.query(AudienceSegment).filter(AudienceSegment.id == segment_id).first()
    if not seg:
        raise HTTPException(status_code=404, detail="Segment not found")
    db.delete(seg)
    db.commit()


@campaign_segments_router.get("/api/campaigns/{campaign_id}/segments", response_model=List[AudienceSegmentOut])
def get_campaign_segments(campaign_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    _get_campaign_or_404(campaign_id, db)
    rows = db.execute(
        campaign_audience_segments.select().where(campaign_audience_segments.c.campaign_id == campaign_id)
    ).fetchall()
    segment_ids = [r.segment_id for r in rows]
    if not segment_ids:
        return []
    return db.query(AudienceSegment).filter(AudienceSegment.id.in_(segment_ids)).all()


@campaign_segments_router.put("/api/campaigns/{campaign_id}/segments", response_model=List[AudienceSegmentOut])
def set_campaign_segments(
    campaign_id: int,
    data: CampaignSegmentsUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    _get_campaign_or_404(campaign_id, db)
    db.execute(campaign_audience_segments.delete().where(campaign_audience_segments.c.campaign_id == campaign_id))
    segments = db.query(AudienceSegment).filter(AudienceSegment.id.in_(data.segment_ids)).all()
    for seg in segments:
        db.execute(campaign_audience_segments.insert().values(campaign_id=campaign_id, segment_id=seg.id))
    db.commit()
    return segments


def _get_campaign_or_404(campaign_id: int, db: Session) -> Campaign:
    c = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return c
