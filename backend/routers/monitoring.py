from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import case, func
from sqlalchemy.orm import Session

from core.dependencies import get_db, require_admin
from models.order import Order, OrderStatus
from models.user import User

router = APIRouter(prefix="/api/monitoring", tags=["monitoring"])

_PERIOD_DAYS = {"day": 1, "week": 7, "month": 30, "year": 365}


@router.get("")
def get_monitoring(
    period: str = Query("month", pattern="^(day|week|month|year)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    days = _PERIOD_DAYS[period]
    since = datetime.now(timezone.utc) - timedelta(days=days)

    total_orders = db.query(func.count(Order.id)).scalar()
    total_revenue = (
        db.query(func.sum(Order.final_price))
        .filter(Order.status == OrderStatus.done)
        .scalar() or 0.0
    )
    active_orders = (
        db.query(func.count(Order.id))
        .filter(Order.status == OrderStatus.in_progress)
        .scalar()
    )
    pending_orders = (
        db.query(func.count(Order.id))
        .filter(Order.status == OrderStatus.pending)
        .scalar()
    )
    overdue_orders = (
        db.query(func.count(Order.id))
        .filter(Order.status == OrderStatus.overdue)
        .scalar()
    )
    new_orders_in_period = (
        db.query(func.count(Order.id))
        .filter(Order.created_at >= since)
        .scalar()
    )

    # Per-day breakdown for the selected period
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
    orders_by_day = []
    for i in range(days):
        d = (since + timedelta(days=i)).date()
        key = str(d)
        orders_by_day.append({
            "date": key,
            "count": date_map.get(key, {}).get("count", 0),
            "revenue": round(date_map.get(key, {}).get("revenue", 0.0), 2),
        })

    # Per-service breakdown (all time)
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

    return {
        "summary": {
            "total_orders": total_orders,
            "active_orders": active_orders,
            "pending_orders": pending_orders,
            "overdue_orders": overdue_orders,
            "total_revenue": round(total_revenue, 2),
            "new_orders_in_period": new_orders_in_period,
        },
        "orders_by_day": orders_by_day,
        "orders_by_service": orders_by_service,
    }
