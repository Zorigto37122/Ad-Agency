from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from core.dependencies import get_db, get_current_user, require_admin
from models.crm import ClientContact
from models.user import User
from schemas.crm import ClientContactCreate, ClientContactUpdate, ClientContactOut

router = APIRouter(prefix="/api/client-contacts", tags=["client_contacts"])


@router.get("", response_model=List[ClientContactOut])
def list_contacts(
    client_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(ClientContact)
    if client_id:
        q = q.filter(ClientContact.client_id == client_id)
    return q.order_by(ClientContact.is_primary.desc(), ClientContact.name).all()


@router.post("", response_model=ClientContactOut, status_code=status.HTTP_201_CREATED)
def create_contact(data: ClientContactCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    contact = ClientContact(**data.model_dump())
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact


@router.get("/{contact_id}", response_model=ClientContactOut)
def get_contact(contact_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    c = db.query(ClientContact).filter(ClientContact.id == contact_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Contact not found")
    return c


@router.put("/{contact_id}", response_model=ClientContactOut)
def update_contact(contact_id: int, data: ClientContactUpdate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    c = db.query(ClientContact).filter(ClientContact.id == contact_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Contact not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(c, k, v)
    db.commit()
    db.refresh(c)
    return c


@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contact(contact_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    c = db.query(ClientContact).filter(ClientContact.id == contact_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Contact not found")
    db.delete(c)
    db.commit()
