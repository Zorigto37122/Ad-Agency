from datetime import date, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from core.dependencies import get_db, get_current_user, require_admin
from models.payment import Invoice, Payment, Refund, PaymentPlan, TaxRecord, LateFee, InvoiceStatus
from models.user import User
from schemas.payment import (
    InvoiceCreate, InvoiceUpdate, InvoiceOut,
    PaymentCreate, PaymentUpdate, PaymentOut,
    RefundCreate, RefundOut,
    PaymentPlanCreate, PaymentPlanOut,
    TaxRecordCreate, TaxRecordOut,
    LateFeeCreate, LateFeeOut,
)
from tasks.email_tasks import send_payment_confirmation

router = APIRouter(prefix="/api/invoices", tags=["payments"])


def _get_invoice_or_404(invoice_id: int, db: Session) -> Invoice:
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return inv


def _get_payment_or_404(invoice_id: int, payment_id: int, db: Session) -> Payment:
    p = db.query(Payment).filter(Payment.id == payment_id, Payment.invoice_id == invoice_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Payment not found")
    return p


@router.get("", response_model=List[InvoiceOut])
def list_invoices(
    order_id: Optional[int] = Query(None),
    invoice_status: Optional[InvoiceStatus] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Invoice)
    if not current_user.is_admin:
        from models.order import Order
        q = q.join(Order).filter(Order.created_by_id == current_user.id)
    if order_id:
        q = q.filter(Invoice.order_id == order_id)
    if invoice_status:
        q = q.filter(Invoice.status == invoice_status)
    return q.order_by(Invoice.created_at.desc()).all()


@router.post("", response_model=InvoiceOut, status_code=status.HTTP_201_CREATED)
def create_invoice(data: InvoiceCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    inv = Invoice(**data.model_dump())
    db.add(inv)
    db.commit()
    db.refresh(inv)
    return inv


@router.get("/{invoice_id}", response_model=InvoiceOut)
def get_invoice(invoice_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return _get_invoice_or_404(invoice_id, db)


@router.put("/{invoice_id}", response_model=InvoiceOut)
def update_invoice(invoice_id: int, data: InvoiceUpdate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    inv = _get_invoice_or_404(invoice_id, db)
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(inv, k, v)
    db.commit()
    db.refresh(inv)
    return inv


@router.delete("/{invoice_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_invoice(invoice_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    inv = _get_invoice_or_404(invoice_id, db)
    db.delete(inv)
    db.commit()


@router.post("/{invoice_id}/payments", response_model=PaymentOut, status_code=status.HTTP_201_CREATED)
def add_payment(invoice_id: int, data: PaymentCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    _get_invoice_or_404(invoice_id, db)
    payment = Payment(invoice_id=invoice_id, **data.model_dump())
    db.add(payment)
    db.commit()
    db.refresh(payment)
    send_payment_confirmation.delay(payment.id)
    return payment


@router.put("/{invoice_id}/payments/{payment_id}", response_model=PaymentOut)
def update_payment(invoice_id: int, payment_id: int, data: PaymentUpdate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    p = _get_payment_or_404(invoice_id, payment_id, db)
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(p, k, v)
    db.commit()
    db.refresh(p)
    return p


@router.post("/{invoice_id}/payments/{payment_id}/refund", response_model=RefundOut, status_code=status.HTTP_201_CREATED)
def create_refund(invoice_id: int, payment_id: int, data: RefundCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    _get_payment_or_404(invoice_id, payment_id, db)
    refund = Refund(payment_id=payment_id, **data.model_dump())
    db.add(refund)
    db.commit()
    db.refresh(refund)
    return refund


@router.post("/{invoice_id}/payment-plan", response_model=List[PaymentPlanOut], status_code=status.HTTP_201_CREATED)
def create_payment_plan(invoice_id: int, data: PaymentPlanCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    inv = _get_invoice_or_404(invoice_id, db)
    db.query(PaymentPlan).filter(PaymentPlan.invoice_id == invoice_id).delete()
    installment_amount = round(inv.amount / data.installments, 2)
    plans = []
    for i in range(data.installments):
        due = date(data.first_due_date.year, data.first_due_date.month, data.first_due_date.day)
        month_offset = data.first_due_date.month - 1 + i
        due = date(
            data.first_due_date.year + month_offset // 12,
            month_offset % 12 + 1,
            data.first_due_date.day,
        )
        plan = PaymentPlan(
            invoice_id=invoice_id,
            installment_number=i + 1,
            due_date=due,
            amount=installment_amount,
        )
        db.add(plan)
        plans.append(plan)
    db.commit()
    for p in plans:
        db.refresh(p)
    return plans


@router.post("/{invoice_id}/tax", response_model=TaxRecordOut, status_code=status.HTTP_201_CREATED)
def add_tax_record(invoice_id: int, data: TaxRecordCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    inv = _get_invoice_or_404(invoice_id, db)
    tax_amount = round(inv.amount * data.tax_rate / 100, 2)
    record = TaxRecord(invoice_id=invoice_id, tax_type=data.tax_type, tax_rate=data.tax_rate, tax_amount=tax_amount)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.post("/{invoice_id}/late-fee", response_model=LateFeeOut, status_code=status.HTTP_201_CREATED)
def add_late_fee(invoice_id: int, data: LateFeeCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    _get_invoice_or_404(invoice_id, db)
    fee = LateFee(invoice_id=invoice_id, **data.model_dump())
    db.add(fee)
    db.commit()
    db.refresh(fee)
    return fee
