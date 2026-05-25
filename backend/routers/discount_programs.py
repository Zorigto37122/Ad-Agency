from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.dependencies import get_db, require_admin
from models.discount_program import DiscountProgram
from models.user import User
from schemas.discount_program import DiscountProgramCreate, DiscountProgramUpdate, DiscountProgramOut

router = APIRouter(prefix="/api/discounts", tags=["discounts"])


@router.get("", response_model=List[DiscountProgramOut])
def list_discounts(
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return db.query(DiscountProgram).order_by(DiscountProgram.min_completed_orders).all()


@router.post("", response_model=DiscountProgramOut, status_code=status.HTTP_201_CREATED)
def create_discount(
    payload: DiscountProgramCreate,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    program = DiscountProgram(**payload.model_dump())
    db.add(program)
    db.commit()
    db.refresh(program)
    return program


@router.put("/{program_id}", response_model=DiscountProgramOut)
def update_discount(
    program_id: int,
    payload: DiscountProgramUpdate,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    program = db.query(DiscountProgram).filter(DiscountProgram.id == program_id).first()
    if not program:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Программа не найдена")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(program, field, value)
    db.commit()
    db.refresh(program)
    return program


@router.delete("/{program_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_discount(
    program_id: int,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    program = db.query(DiscountProgram).filter(DiscountProgram.id == program_id).first()
    if not program:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Программа не найдена")
    db.delete(program)
    db.commit()
