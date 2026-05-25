from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from core.dependencies import get_db, get_current_user, require_admin
from models.campaign import Campaign, MediaChannel, CampaignMetric, CampaignReport, CampaignStatus
from models.user import User
from schemas.campaign import (
    CampaignCreate, CampaignUpdate, CampaignOut,
    MediaChannelCreate, MediaChannelUpdate, MediaChannelOut,
    MetricCreate, MetricOut,
    ReportCreate, ReportOut,
)

router = APIRouter(tags=["campaigns"])
channels_router = APIRouter(prefix="/api/channels", tags=["media_channels"])


# ── Campaigns ──────────────────────────────────────────────────────────────────

@router.get("/api/campaigns", response_model=List[CampaignOut])
def list_campaigns(
    order_id: Optional[int] = Query(None),
    campaign_status: Optional[CampaignStatus] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(Campaign)
    if order_id:
        q = q.filter(Campaign.order_id == order_id)
    if campaign_status:
        q = q.filter(Campaign.status == campaign_status)
    return q.order_by(Campaign.created_at.desc()).all()


@router.post("/api/campaigns", response_model=CampaignOut, status_code=status.HTTP_201_CREATED)
def create_campaign(
    data: CampaignCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    channels = db.query(MediaChannel).filter(MediaChannel.id.in_(data.channel_ids)).all()
    campaign = Campaign(
        order_id=data.order_id,
        name=data.name,
        description=data.description,
        budget=data.budget,
        start_date=data.start_date,
        end_date=data.end_date,
        media_channels=channels,
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return campaign


@router.get("/api/campaigns/{campaign_id}", response_model=CampaignOut)
def get_campaign(
    campaign_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    c = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return c


@router.put("/api/campaigns/{campaign_id}", response_model=CampaignOut)
def update_campaign(
    campaign_id: int,
    data: CampaignUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    c = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")

    update_data = data.model_dump(exclude_unset=True)
    channel_ids = update_data.pop("channel_ids", None)
    for k, v in update_data.items():
        setattr(c, k, v)
    if channel_ids is not None:
        c.media_channels = db.query(MediaChannel).filter(MediaChannel.id.in_(channel_ids)).all()

    db.commit()
    db.refresh(c)
    return c


@router.delete("/api/campaigns/{campaign_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_campaign(
    campaign_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    c = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")
    db.delete(c)
    db.commit()


# ── Metrics ────────────────────────────────────────────────────────────────────

@router.get("/api/campaigns/{campaign_id}/metrics", response_model=List[MetricOut])
def list_metrics(
    campaign_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    _get_campaign_or_404(campaign_id, db)
    return db.query(CampaignMetric).filter(CampaignMetric.campaign_id == campaign_id).order_by(CampaignMetric.date.desc()).all()


@router.post("/api/campaigns/{campaign_id}/metrics", response_model=MetricOut, status_code=status.HTTP_201_CREATED)
def add_metric(
    campaign_id: int,
    data: MetricCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    _get_campaign_or_404(campaign_id, db)
    ctr = round(data.clicks / data.impressions * 100, 4) if data.impressions > 0 else 0.0
    metric = CampaignMetric(
        campaign_id=campaign_id,
        channel_id=data.channel_id,
        date=data.date,
        impressions=data.impressions,
        clicks=data.clicks,
        ctr=ctr,
        conversions=data.conversions,
        spend=data.spend,
    )
    db.add(metric)
    db.commit()
    db.refresh(metric)
    return metric


# ── Reports ────────────────────────────────────────────────────────────────────

@router.get("/api/campaigns/{campaign_id}/reports", response_model=List[ReportOut])
def list_reports(
    campaign_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    _get_campaign_or_404(campaign_id, db)
    return db.query(CampaignReport).filter(CampaignReport.campaign_id == campaign_id).order_by(CampaignReport.generated_at.desc()).all()


@router.post("/api/campaigns/{campaign_id}/reports", response_model=ReportOut, status_code=status.HTTP_201_CREATED)
def generate_report(
    campaign_id: int,
    data: ReportCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    _get_campaign_or_404(campaign_id, db)
    metrics = (
        db.query(CampaignMetric)
        .filter(
            CampaignMetric.campaign_id == campaign_id,
            CampaignMetric.date >= data.period_start,
            CampaignMetric.date <= data.period_end,
        )
        .all()
    )
    total_impressions = sum(m.impressions for m in metrics)
    total_clicks = sum(m.clicks for m in metrics)
    total_conversions = sum(m.conversions for m in metrics)
    total_spend = sum(m.spend for m in metrics)
    avg_ctr = round(total_clicks / total_impressions * 100, 4) if total_impressions > 0 else 0.0

    report = CampaignReport(
        campaign_id=campaign_id,
        period=data.period,
        period_start=data.period_start,
        period_end=data.period_end,
        total_impressions=total_impressions,
        total_clicks=total_clicks,
        avg_ctr=avg_ctr,
        total_conversions=total_conversions,
        total_spend=total_spend,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


# ── Media Channels ─────────────────────────────────────────────────────────────

@channels_router.get("", response_model=List[MediaChannelOut])
def list_channels(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(MediaChannel).order_by(MediaChannel.name).all()


@channels_router.post("", response_model=MediaChannelOut, status_code=status.HTTP_201_CREATED)
def create_channel(data: MediaChannelCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    existing = db.query(MediaChannel).filter(MediaChannel.name == data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Channel with this name already exists")
    channel = MediaChannel(**data.model_dump())
    db.add(channel)
    db.commit()
    db.refresh(channel)
    return channel


@channels_router.put("/{channel_id}", response_model=MediaChannelOut)
def update_channel(channel_id: int, data: MediaChannelUpdate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    ch = db.query(MediaChannel).filter(MediaChannel.id == channel_id).first()
    if not ch:
        raise HTTPException(status_code=404, detail="Channel not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(ch, k, v)
    db.commit()
    db.refresh(ch)
    return ch


@channels_router.delete("/{channel_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_channel(channel_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    ch = db.query(MediaChannel).filter(MediaChannel.id == channel_id).first()
    if not ch:
        raise HTTPException(status_code=404, detail="Channel not found")
    db.delete(ch)
    db.commit()


def _get_campaign_or_404(campaign_id: int, db: Session) -> Campaign:
    c = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return c
