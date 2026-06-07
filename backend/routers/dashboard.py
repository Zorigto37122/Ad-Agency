from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import case, func
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

    # Orders by service type
    service_rows = (
        db.query(
            Order.service_type.label("service_type"),
            func.count(Order.id).label("count"),
            func.coalesce(func.sum(Order.final_price), 0).label("revenue"),
            func.count(
                case((Order.status == OrderStatus.overdue, 1), else_=None)
            ).label("overdue"),
        )
        .group_by(Order.service_type)
        .all()
    )

    orders_by_service = [
        {
            "service_type": r.service_type,
            "count": r.count,
            "revenue": round(float(r.revenue), 2),
            "overdue": r.overdue,
        }
        for r in service_rows
    ]

    # Orders per day for last 30 days
    since = datetime.now(timezone.utc) - timedelta(days=30)
    day_rows = (
        db.query(
            func.date(Order.created_at).label("date"),
            func.count(Order.id).label("count"),
            func.coalesce(func.sum(Order.final_price), 0).label("revenue"),
        )
        .filter(Order.created_at >= since)
        .group_by(func.date(Order.created_at))
        .order_by(func.date(Order.created_at))
        .all()
    )

    date_map = {str(r.date): {"count": r.count, "revenue": float(r.revenue)} for r in day_rows}
    orders_last_30_days = []
    for i in range(30):
        d = (since + timedelta(days=i)).date()
        key = str(d)
        orders_last_30_days.append({
            "date": key,
            "count": date_map.get(key, {}).get("count", 0),
            "revenue": round(date_map.get(key, {}).get("revenue", 0.0), 2),
        })

    return {
        "total_orders": total_orders,
        "total_revenue": round(total_revenue, 2),
        "active_orders": active_orders,
        "pending_orders": pending_orders,
        "overdue_orders": overdue_orders,
        "total_clients": total_clients,
        "orders_by_service": orders_by_service,
        "orders_last_30_days": orders_last_30_days,
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
