from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from core.dependencies import get_db, require_admin
from models.client import Client
from models.order import Order, OrderStatus
from models.user import User

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("")
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    total_orders = db.query(func.count(Order.id)).scalar()
    total_revenue = db.query(func.sum(Order.final_price)).filter(
        Order.status == OrderStatus.done
    ).scalar() or 0.0
    active_orders = db.query(func.count(Order.id)).filter(
        Order.status == OrderStatus.in_progress
    ).scalar()
    pending_orders = db.query(func.count(Order.id)).filter(
        Order.status == OrderStatus.pending
    ).scalar()
    overdue_orders = db.query(func.count(Order.id)).filter(
        Order.status == OrderStatus.overdue
    ).scalar()
    total_clients = db.query(func.count(Client.id)).scalar()

    recent_orders = (
        db.query(Order)
        .order_by(Order.created_at.desc())
        .limit(5)
        .all()
    )

    return {
        "total_orders": total_orders,
        "total_revenue": round(total_revenue, 2),
        "active_orders": active_orders,
        "pending_orders": pending_orders,
        "overdue_orders": overdue_orders,
        "total_clients": total_clients,
        "recent_orders": [
            {
                "id": o.id,
                "title": o.title,
                "client_name": o.client.name,
                "status": o.status,
                "final_price": o.final_price,
                "created_at": o.created_at,
            }
            for o in recent_orders
        ],
    }
