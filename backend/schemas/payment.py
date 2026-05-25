from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel

from models.payment import InvoiceStatus, PaymentStatus, PaymentMethod, RefundStatus, PlanStatus, TaxType


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
    created_at: datetime

    model_config = {"from_attributes": True}


class TaxRecordCreate(BaseModel):
    tax_type: TaxType
    tax_rate: float


class TaxRecordOut(BaseModel):
    id: int
    invoice_id: int
    tax_type: TaxType
    tax_rate: float
    tax_amount: float
    created_at: datetime

    model_config = {"from_attributes": True}


class LateFeeCreate(BaseModel):
    amount: float
    reason: Optional[str] = None


class LateFeeOut(BaseModel):
    id: int
    invoice_id: int
    amount: float
    reason: Optional[str]
    applied_at: datetime

    model_config = {"from_attributes": True}


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
    tax_records: List[TaxRecordOut] = []
    late_fees: List[LateFeeOut] = []

    model_config = {"from_attributes": True}
