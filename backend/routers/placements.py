from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from core.dependencies import get_db, get_current_user, require_admin
from models.placement import AdPlacement, ContentCalendarEntry, PlacementStatus
from models.user import User
from schemas.placement import (
    AdPlacementCreate, AdPlacementUpdate, AdPlacementOut,
    ContentCalendarCreate, ContentCalendarUpdate, ContentCalendarOut,
)

router = APIRouter(tags=["placements"])
calendar_router = APIRouter(tags=["content_calendar"])


# ── Ad Placements ──────────────────────────────────────────────────────────────

@router.get("/api/placements", response_model=List[AdPlacementOut])
def list_placements(
    campaign_id: Optional[int] = Query(None),
    channel_id: Optional[int] = Query(None),
    placement_status: Optional[PlacementStatus] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(AdPlacement)
    if campaign_id:
        q = q.filter(AdPlacement.campaign_id == campaign_id)
    if channel_id:
        q = q.filter(AdPlacement.channel_id == channel_id)
    if placement_status:
        q = q.filter(AdPlacement.status == placement_status)
    return q.order_by(AdPlacement.scheduled_at).all()


@router.post("/api/placements", response_model=AdPlacementOut, status_code=status.HTTP_201_CREATED)
def create_placement(data: AdPlacementCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    placement = AdPlacement(**data.model_dump())
    db.add(placement)
    db.commit()
    db.refresh(placement)
    return placement


@router.get("/api/placements/{placement_id}", response_model=AdPlacementOut)
def get_placement(placement_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    p = db.query(AdPlacement).filter(AdPlacement.id == placement_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Placement not found")
    return p


@router.put("/api/placements/{placement_id}", response_model=AdPlacementOut)
def update_placement(placement_id: int, data: AdPlacementUpdate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    p = db.query(AdPlacement).filter(AdPlacement.id == placement_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Placement not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(p, k, v)
    db.commit()
    db.refresh(p)
    return p


@router.delete("/api/placements/{placement_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_placement(placement_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    p = db.query(AdPlacement).filter(AdPlacement.id == placement_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Placement not found")
    db.delete(p)
    db.commit()


# ── Content Calendar ───────────────────────────────────────────────────────────

@calendar_router.get("/api/content-calendar", response_model=List[ContentCalendarOut])
def list_calendar(
    campaign_id: Optional[int] = Query(None),
    month: Optional[str] = Query(None, description="YYYY-MM"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(ContentCalendarEntry)
    if campaign_id:
        q = q.filter(ContentCalendarEntry.campaign_id == campaign_id)
    if month:
        try:
            year, mon = int(month[:4]), int(month[5:7])
            from datetime import date
            import calendar
            last_day = calendar.monthrange(year, mon)[1]
            q = q.filter(
                ContentCalendarEntry.scheduled_date >= date(year, mon, 1),
                ContentCalendarEntry.scheduled_date <= date(year, mon, last_day),
            )
        except (ValueError, IndexError):
            pass
    return q.order_by(ContentCalendarEntry.scheduled_date).all()


@calendar_router.post("/api/content-calendar", response_model=ContentCalendarOut, status_code=status.HTTP_201_CREATED)
def create_calendar_entry(data: ContentCalendarCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    entry = ContentCalendarEntry(**data.model_dump())
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@calendar_router.get("/api/content-calendar/{entry_id}", response_model=ContentCalendarOut)
def get_calendar_entry(entry_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    e = db.query(ContentCalendarEntry).filter(ContentCalendarEntry.id == entry_id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Entry not found")
    return e


@calendar_router.put("/api/content-calendar/{entry_id}", response_model=ContentCalendarOut)
def update_calendar_entry(entry_id: int, data: ContentCalendarUpdate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    e = db.query(ContentCalendarEntry).filter(ContentCalendarEntry.id == entry_id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Entry not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(e, k, v)
    db.commit()
    db.refresh(e)
    return e


@calendar_router.delete("/api/content-calendar/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_calendar_entry(entry_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    e = db.query(ContentCalendarEntry).filter(ContentCalendarEntry.id == entry_id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Entry not found")
    db.delete(e)
    db.commit()
