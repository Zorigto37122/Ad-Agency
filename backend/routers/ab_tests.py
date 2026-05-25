from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.dependencies import get_db, get_current_user, require_admin
from models.ab_test import CampaignVariant
from models.campaign import Campaign
from models.user import User
from schemas.ab_test import VariantCreate, VariantUpdate, VariantOut

router = APIRouter(prefix="/api/campaigns", tags=["ab_testing"])


def _get_campaign_or_404(campaign_id: int, db: Session) -> Campaign:
    c = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return c


def _get_variant_or_404(campaign_id: int, variant_id: int, db: Session) -> CampaignVariant:
    v = db.query(CampaignVariant).filter(
        CampaignVariant.id == variant_id,
        CampaignVariant.campaign_id == campaign_id,
    ).first()
    if not v:
        raise HTTPException(status_code=404, detail="Variant not found")
    return v


@router.get("/{campaign_id}/variants", response_model=List[VariantOut])
def list_variants(campaign_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    _get_campaign_or_404(campaign_id, db)
    return db.query(CampaignVariant).filter(CampaignVariant.campaign_id == campaign_id).order_by(CampaignVariant.created_at).all()


@router.post("/{campaign_id}/variants", response_model=VariantOut, status_code=status.HTTP_201_CREATED)
def create_variant(campaign_id: int, data: VariantCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    _get_campaign_or_404(campaign_id, db)
    variant = CampaignVariant(campaign_id=campaign_id, **data.model_dump())
    db.add(variant)
    db.commit()
    db.refresh(variant)
    return variant


@router.put("/{campaign_id}/variants/{variant_id}", response_model=VariantOut)
def update_variant(
    campaign_id: int,
    variant_id: int,
    data: VariantUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    v = _get_variant_or_404(campaign_id, variant_id, db)
    update_data = data.model_dump(exclude_unset=True)
    if update_data.get("is_winner"):
        db.query(CampaignVariant).filter(
            CampaignVariant.campaign_id == campaign_id,
            CampaignVariant.id != variant_id,
        ).update({"is_winner": False})
    for k, val in update_data.items():
        setattr(v, k, val)
    db.commit()
    db.refresh(v)
    return v


@router.delete("/{campaign_id}/variants/{variant_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_variant(campaign_id: int, variant_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    v = _get_variant_or_404(campaign_id, variant_id, db)
    db.delete(v)
    db.commit()


@router.post("/{campaign_id}/variants/{variant_id}/declare-winner", response_model=VariantOut)
def declare_winner(
    campaign_id: int,
    variant_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    _get_campaign_or_404(campaign_id, db)
    db.query(CampaignVariant).filter(CampaignVariant.campaign_id == campaign_id).update({"is_winner": False})
    v = _get_variant_or_404(campaign_id, variant_id, db)
    v.is_winner = True
    db.commit()
    db.refresh(v)
    return v
