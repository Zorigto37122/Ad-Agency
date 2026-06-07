import logging
from datetime import date, datetime, timezone
from typing import List, Optional
import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

from core.config import settings
from core.dependencies import get_db, get_current_user, require_admin
from integrations import yookassa
from models.payment import (
    Invoice, Payment, Refund, PaymentPlan, InvoiceStatus, PaymentStatus, PaymentMethod, PlanStatus,
)
from models.user import User
from schemas.payment import (
    InvoiceCreate, InvoiceUpdate, InvoiceOut,
    PaymentCreate, PaymentUpdate, PaymentOut,
    RefundCreate, RefundOut,
    PaymentPlanCreate, PaymentPlanOut,
    PaymentInitiate, PaymentInitiateOut,
)
from tasks.email_tasks import send_payment_confirmation

router = APIRouter(prefix="/api/invoices", tags=["payments"])
webhook_router = APIRouter(prefix="/api/payments", tags=["payments"])


def _refresh_overdue_plans(inv: Invoice, db: Session) -> None:
    """Flip instalments whose due date has passed and are still unpaid to 'overdue'."""
    today = date.today()
    changed = False
    for plan in inv.payment_plans:
        if plan.status == PlanStatus.pending and plan.due_date < today:
            plan.status = PlanStatus.overdue
            changed = True
    if changed:
        db.commit()


def _get_invoice_or_404(invoice_id: int, db: Session) -> Invoice:
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    _refresh_overdue_plans(inv, db)
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


@router.post("/{invoice_id}/pay", response_model=PaymentInitiateOut, status_code=status.HTTP_201_CREATED)
def initiate_payment(
    invoice_id: int,
    data: PaymentInitiate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Start an online card payment via YooKassa for the whole invoice or a single
    instalment, and return a confirmation_token for the embedded checkout widget."""
    inv = _get_invoice_or_404(invoice_id, db)

    description = f"Оплата счёта №{inv.id}"
    amount = inv.amount
    plan: Optional[PaymentPlan] = None
    if data.installment_id is not None:
        plan = db.query(PaymentPlan).filter(
            PaymentPlan.id == data.installment_id, PaymentPlan.invoice_id == invoice_id,
        ).first()
        if not plan:
            raise HTTPException(status_code=404, detail="Installment not found")
        if plan.status == PlanStatus.paid:
            raise HTTPException(status_code=400, detail="Installment already paid")
        amount = plan.amount
        description = f"Оплата счёта №{inv.id} (часть {plan.installment_number})"

    if not settings.yookassa_shop_id or not settings.yookassa_secret_key:
        raise HTTPException(status_code=503, detail="Online payment is not configured")

    return_url = data.return_url or settings.yookassa_return_url
    try:
        yk_payment = yookassa.create_payment(
            amount=amount,
            description=description,
            return_url=return_url,
            metadata={"invoice_id": invoice_id, "installment_id": plan.id if plan else None},
        )
    except httpx.HTTPError as exc:
        logger.error("YooKassa payment creation failed: %s", exc)
        raise HTTPException(status_code=502, detail="Payment gateway error — please try again later")

    payment = Payment(
        invoice_id=invoice_id,
        payment_date=datetime.now(timezone.utc),
        amount=amount,
        method=PaymentMethod.card,
        currency="RUB",
        status=PaymentStatus.pending,
        transaction_ref=yk_payment["id"],
    )
    db.add(payment)
    db.flush()
    if plan:
        plan.payment_id = payment.id
    db.commit()

    return PaymentInitiateOut(
        payment_id=payment.id,
        confirmation_token=yk_payment["confirmation"]["confirmation_token"],
    )


@webhook_router.post("/yookassa/webhook", status_code=status.HTTP_200_OK)
async def yookassa_webhook(request: Request, db: Session = Depends(get_db)):
    """Receives payment status notifications from YooKassa.

    The notification body is never trusted directly — we re-fetch the payment
    from YooKassa's API by id, which is the provider's recommended way to guard
    against forged webhook calls."""
    body = await request.json()
    yk_object = body.get("object") or {}
    yk_payment_id = yk_object.get("id")
    if not yk_payment_id:
        return {"status": "ignored"}

    payment = db.query(Payment).filter(Payment.transaction_ref == yk_payment_id).first()
    if not payment:
        return {"status": "ignored"}

    try:
        yk_payment = yookassa.fetch_payment(yk_payment_id)
    except httpx.HTTPError as exc:
        logger.error("YooKassa payment lookup failed for %s: %s", yk_payment_id, exc)
        raise HTTPException(status_code=502, detail="Could not verify payment status")
    yk_status = yk_payment.get("status")

    if yk_status == "succeeded" and payment.status != PaymentStatus.completed:
        payment.status = PaymentStatus.completed
        plan = db.query(PaymentPlan).filter(PaymentPlan.payment_id == payment.id).first()
        if plan:
            plan.status = PlanStatus.paid

        inv = db.query(Invoice).filter(Invoice.id == payment.invoice_id).first()
        paid_total = sum(p.amount for p in inv.payments if p.status == PaymentStatus.completed)
        if paid_total >= inv.amount:
            inv.status = InvoiceStatus.paid

        db.commit()
        send_payment_confirmation.delay(payment.id)
    elif yk_status == "canceled" and payment.status != PaymentStatus.failed:
        payment.status = PaymentStatus.failed
        plan = db.query(PaymentPlan).filter(PaymentPlan.payment_id == payment.id).first()
        if plan:
            plan.payment_id = None
        db.commit()

    return {"status": "ok"}
