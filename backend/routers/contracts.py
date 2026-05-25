from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from core.dependencies import get_db, get_current_user, require_admin
from models.crm import Contract, ContractStatus
from models.user import User
from schemas.crm import ContractCreate, ContractUpdate, ContractOut

router = APIRouter(prefix="/api/contracts", tags=["contracts"])


@router.get("", response_model=List[ContractOut])
def list_contracts(
    client_id: Optional[int] = Query(None),
    contract_status: Optional[ContractStatus] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(Contract)
    if client_id:
        q = q.filter(Contract.client_id == client_id)
    if contract_status:
        q = q.filter(Contract.status == contract_status)
    return q.order_by(Contract.created_at.desc()).all()


@router.post("", response_model=ContractOut, status_code=status.HTTP_201_CREATED)
def create_contract(data: ContractCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    contract = Contract(**data.model_dump())
    db.add(contract)
    db.commit()
    db.refresh(contract)
    return contract


@router.get("/{contract_id}", response_model=ContractOut)
def get_contract(contract_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    c = db.query(Contract).filter(Contract.id == contract_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Contract not found")
    return c


@router.put("/{contract_id}", response_model=ContractOut)
def update_contract(contract_id: int, data: ContractUpdate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    c = db.query(Contract).filter(Contract.id == contract_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Contract not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(c, k, v)
    db.commit()
    db.refresh(c)
    return c


@router.delete("/{contract_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contract(contract_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    c = db.query(Contract).filter(Contract.id == contract_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Contract not found")
    db.delete(c)
    db.commit()
