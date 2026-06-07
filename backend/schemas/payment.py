from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel

from models.payment import InvoiceStatus, PaymentStatus, PaymentMethod, RefundStatus, PlanStatus


class RefundCreate(BaseModel):
    amount: float
    reason: str


class RefundOut(BaseModel):
    id: int
    payment_id: int
    amount: float
    reason: str
    status: RefundStatus
    refund_date: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}


class PaymentCreate(BaseModel):
    payment_date: datetime
    amount: float
    method: PaymentMethod
    currency: str = "RUB"
    transaction_ref: Optional[str] = None


class PaymentUpdate(BaseModel):
    status: Optional[PaymentStatus] = None
    transaction_ref: Optional[str] = None


class PaymentOut(BaseModel):
    id: int
    invoice_id: int
    payment_date: datetime
    amount: float
    method: PaymentMethod
    currency: str
    status: PaymentStatus
    transaction_ref: Optional[str]
    created_at: datetime
    refunds: List[RefundOut] = []

    model_config = {"from_attributes": True}


class PaymentPlanCreate(BaseModel):
    installments: int
    first_due_date: date


class PaymentPlanOut(BaseModel):
    id: int
    invoice_id: int
    installment_number: int
    due_date: date
    amount: float
    status: PlanStatus
    payment_id: Optional[int]
    created_at: datetime

    model_config = {"from_attributes": True}


class PaymentInitiate(BaseModel):
    installment_id: Optional[int] = None
    return_url: Optional[str] = None


class PaymentInitiateOut(BaseModel):
    payment_id: int
    confirmation_token: str


class InvoiceCreate(BaseModel):
    order_id: int
    issue_date: date
    due_date: date
    amount: float
    notes: Optional[str] = None


class InvoiceUpdate(BaseModel):
    due_date: Optional[date] = None
    amount: Optional[float] = None
    status: Optional[InvoiceStatus] = None
    notes: Optional[str] = None


class InvoiceOut(BaseModel):
    id: int
    order_id: int
    issue_date: date
    due_date: date
    amount: float
    status: InvoiceStatus
    notes: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    payments: List[PaymentOut] = []
    payment_plans: List[PaymentPlanOut] = []

    model_config = {"from_attributes": True}
