from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from core.dependencies import get_db, require_admin
from models.client import Client
from models.crm import Lead, LeadStatus, LeadSource
from models.user import User
from schemas.crm import LeadCreate, LeadUpdate, LeadOut

router = APIRouter(prefix="/api/leads", tags=["leads"])


def _get_lead_or_404(lead_id: int, db: Session) -> Lead:
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead


@router.get("", response_model=List[LeadOut])
def list_leads(
    lead_status: Optional[LeadStatus] = Query(None, alias="status"),
    source: Optional[LeadSource] = Query(None),
    assigned_to_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    q = db.query(Lead)
    if lead_status:
        q = q.filter(Lead.status == lead_status)
    if source:
        q = q.filter(Lead.source == source)
    if assigned_to_id:
        q = q.filter(Lead.assigned_to_id == assigned_to_id)
    return q.order_by(Lead.created_at.desc()).all()


@router.post("", response_model=LeadOut, status_code=status.HTTP_201_CREATED)
def create_lead(data: LeadCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    lead = Lead(**data.model_dump())
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead


@router.get("/{lead_id}", response_model=LeadOut)
def get_lead(lead_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return _get_lead_or_404(lead_id, db)


@router.put("/{lead_id}", response_model=LeadOut)
def update_lead(lead_id: int, data: LeadUpdate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    lead = _get_lead_or_404(lead_id, db)
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(lead, k, v)
    db.commit()
    db.refresh(lead)
    return lead


@router.delete("/{lead_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lead(lead_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    lead = _get_lead_or_404(lead_id, db)
    db.delete(lead)
    db.commit()


@router.post("/{lead_id}/convert", response_model=LeadOut)
def convert_lead(lead_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    lead = _get_lead_or_404(lead_id, db)
    if lead.status == LeadStatus.won:
        raise HTTPException(status_code=400, detail="Lead already converted")

    existing = db.query(Client).filter(Client.email == lead.email).first() if lead.email else None
    if not existing:
        client = Client(
            name=lead.name,
            email=lead.email or f"lead_{lead.id}@noemail.local",
            phone=lead.phone,
            company=lead.company,
        )
        db.add(client)

    lead.status = LeadStatus.won
    db.commit()
    db.refresh(lead)
    return lead
