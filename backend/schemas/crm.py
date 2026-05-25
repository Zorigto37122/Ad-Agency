from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel

from models.crm import ContractStatus, TaskStatus, TaskPriority, LeadStatus, LeadSource


class ContractCreate(BaseModel):
    client_id: int
    title: str
    order_id: Optional[int] = None
    content: Optional[str] = None
    expires_at: Optional[datetime] = None


class ContractUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    status: Optional[ContractStatus] = None
    signed_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None


class ContractOut(BaseModel):
    id: int
    client_id: int
    order_id: Optional[int]
    title: str
    content: Optional[str]
    status: ContractStatus
    signed_at: Optional[datetime]
    expires_at: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = {"from_attributes": True}


class TimeLogCreate(BaseModel):
    hours: float
    logged_at: date
    description: Optional[str] = None


class TimeLogOut(BaseModel):
    id: int
    task_id: int
    user_id: int
    hours: float
    logged_at: date
    description: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class TaskCreate(BaseModel):
    title: str
    order_id: Optional[int] = None
    assigned_to_id: Optional[int] = None
    description: Optional[str] = None
    priority: TaskPriority = TaskPriority.medium
    due_date: Optional[date] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    assigned_to_id: Optional[int] = None
    due_date: Optional[date] = None


class TaskOut(BaseModel):
    id: int
    order_id: Optional[int]
    assigned_to_id: Optional[int]
    title: str
    description: Optional[str]
    status: TaskStatus
    priority: TaskPriority
    due_date: Optional[date]
    created_at: datetime
    updated_at: Optional[datetime]
    time_logs: List[TimeLogOut] = []

    model_config = {"from_attributes": True}


class ClientContactCreate(BaseModel):
    client_id: int
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    is_primary: bool = False


class ClientContactUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    is_primary: Optional[bool] = None


class ClientContactOut(BaseModel):
    id: int
    client_id: int
    name: str
    email: Optional[str]
    phone: Optional[str]
    role: Optional[str]
    is_primary: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class VendorCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    specialty: Optional[str] = None
    rating: Optional[float] = None
    notes: Optional[str] = None


class VendorUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    specialty: Optional[str] = None
    rating: Optional[float] = None
    notes: Optional[str] = None


class VendorOut(BaseModel):
    id: int
    name: str
    email: Optional[str]
    phone: Optional[str]
    specialty: Optional[str]
    rating: Optional[float]
    notes: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = {"from_attributes": True}


class LeadCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    source: LeadSource = LeadSource.other
    notes: Optional[str] = None
    assigned_to_id: Optional[int] = None


class LeadUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    source: Optional[LeadSource] = None
    status: Optional[LeadStatus] = None
    notes: Optional[str] = None
    assigned_to_id: Optional[int] = None


class LeadOut(BaseModel):
    id: int
    name: str
    email: Optional[str]
    phone: Optional[str]
    company: Optional[str]
    source: LeadSource
    status: LeadStatus
    notes: Optional[str]
    assigned_to_id: Optional[int]
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = {"from_attributes": True}
