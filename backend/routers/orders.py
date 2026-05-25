import logging
import os
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from core.dependencies import get_db, get_current_user, require_admin
from models.client import Client
from models.order import Order, OrderStatus
from models.user import User
from schemas.order import OrderCreate, OrderUpdate, OrderOut
from utils.pricing import calculate_price, find_best_discount

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx", ".txt", ".png", ".jpg", ".jpeg", ".xlsx", ".zip"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/orders", tags=["orders"])


def _check_overdue(order: Order) -> None:
    if (
        order.deadline
        and order.deadline.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc)
        and order.status not in (OrderStatus.done, OrderStatus.cancelled)
    ):
        order.status = OrderStatus.overdue


@router.get("", response_model=List[OrderOut])
def list_orders(
    status: Optional[OrderStatus] = Query(None),
    client_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Order).join(Client)
    if not current_user.is_admin:
        q = q.filter(Order.created_by_id == current_user.id)
    if status:
        q = q.filter(Order.status == status)
    if client_id:
        q = q.filter(Order.client_id == client_id)
    if search:
        q = q.filter(
            Order.title.ilike(f"%{search}%") | Client.name.ilike(f"%{search}%")
        )
    orders = q.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()
    for o in orders:
        _check_overdue(o)
    db.commit()
    return orders


@router.post("", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def create_order(
    order_in: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    client = db.query(Client).filter(Client.id == order_in.client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    discount_percent, discount_program_id = find_best_discount(db, order_in.client_id)
    pricing = calculate_price(order_in.service_type, order_in.scope, discount_percent)

    order = Order(
        client_id=order_in.client_id,
        title=order_in.title,
        description=order_in.description,
        service_type=order_in.service_type,
        scope=order_in.scope,
        deadline=order_in.deadline,
        created_by_id=current_user.id,
        discount_program_id=discount_program_id,
        **pricing,
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    logger.info(f"Order created: {order.id} for client {client.name}")
    return order


def _check_order_access(order: Order, current_user: User) -> None:
    if not current_user.is_admin and order.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Нет доступа к этому заказу")


@router.get("/{order_id}", response_model=OrderOut)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    _check_order_access(order, current_user)
    _check_overdue(order)
    db.commit()
    return order


@router.put("/{order_id}", response_model=OrderOut)
def update_order(
    order_id: int,
    order_in: OrderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    _check_order_access(order, current_user)

    data = order_in.model_dump(exclude_unset=True)
    service_type = data.get("service_type", order.service_type)
    scope = data.get("scope", order.scope)

    if "service_type" in data or "scope" in data:
        pricing = calculate_price(service_type, scope, order.discount_percent)
        for k, v in pricing.items():
            setattr(order, k, v)

    for field, value in data.items():
        if field not in ("service_type", "scope"):
            setattr(order, field, value)
    if "service_type" in data:
        order.service_type = data["service_type"]
    if "scope" in data:
        order.scope = data["scope"]

    _check_overdue(order)
    db.commit()
    db.refresh(order)
    logger.info(f"Order updated: {order_id}")
    return order


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    _check_order_access(order, current_user)
    if order.attachment_path and os.path.exists(order.attachment_path):
        os.remove(order.attachment_path)
    db.delete(order)
    db.commit()
    logger.info(f"Order deleted: {order_id}")


@router.post("/{order_id}/attachment", response_model=OrderOut)
async def upload_attachment(
    order_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    _check_order_access(order, current_user)

    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Тип файла не поддерживается. Разрешено: {', '.join(ALLOWED_EXTENSIONS)}")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Файл слишком большой (максимум 10 МБ)")

    # Remove old file if present
    if order.attachment_path and os.path.exists(order.attachment_path):
        os.remove(order.attachment_path)

    safe_name = f"order_{order_id}_{uuid.uuid4().hex}{ext}"
    dest = os.path.join(UPLOAD_DIR, safe_name)
    with open(dest, "wb") as f:
        f.write(content)

    order.attachment_filename = file.filename
    order.attachment_path = dest
    db.commit()
    db.refresh(order)
    logger.info(f"Attachment uploaded for order {order_id}: {file.filename}")
    return order


@router.delete("/{order_id}/attachment", response_model=OrderOut)
def delete_attachment(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    _check_order_access(order, current_user)

    if order.attachment_path and os.path.exists(order.attachment_path):
        os.remove(order.attachment_path)
    order.attachment_filename = None
    order.attachment_path = None
    db.commit()
    db.refresh(order)
    return order


@router.get("/{order_id}/attachment")
def download_attachment(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    _check_order_access(order, current_user)
    if not order.attachment_path or not os.path.exists(order.attachment_path):
        raise HTTPException(status_code=404, detail="Файл не найден")

    return FileResponse(
        path=order.attachment_path,
        filename=order.attachment_filename or "attachment",
        media_type="application/octet-stream",
    )
