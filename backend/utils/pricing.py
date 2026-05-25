from typing import Optional
from sqlalchemy.orm import Session

from models.order import ServiceType, ScopeType, OrderStatus

BASE_PRICES = {
    ServiceType.web_design: 1000.0,
    ServiceType.graphic_design: 500.0,
    ServiceType.social_media_campaign: 2000.0,
    ServiceType.video_production: 3000.0,
    ServiceType.copywriting: 300.0,
}

SCOPE_MULTIPLIERS = {
    ScopeType.small: 0.75,
    ScopeType.medium: 1.0,
    ScopeType.large: 1.5,
}


def find_best_discount(
    db: Session, client_id: int
) -> tuple[float, Optional[int]]:
    """Return (discount_percent, program_id) for the client based on active discount programs."""
    from models.discount_program import DiscountProgram
    from models.order import Order

    completed = (
        db.query(Order)
        .filter(Order.client_id == client_id, Order.status == OrderStatus.done)
        .count()
    )

    program = (
        db.query(DiscountProgram)
        .filter(
            DiscountProgram.is_active == True,  # noqa: E712
            DiscountProgram.min_completed_orders <= completed,
        )
        .order_by(DiscountProgram.min_completed_orders.desc())
        .first()
    )
    if program:
        return program.discount_percent, program.id
    return 0.0, None


def calculate_price(
    service_type: ServiceType,
    scope: ScopeType,
    discount_percent: float = 0.0,
) -> dict:
    base_price = BASE_PRICES[service_type]
    multiplier = SCOPE_MULTIPLIERS[scope]
    subtotal = base_price * multiplier
    final_price = subtotal * (1 - discount_percent / 100)
    return {
        "base_price": base_price,
        "scope_multiplier": multiplier,
        "discount_percent": discount_percent,
        "final_price": round(final_price, 2),
    }
