from datetime import date, timedelta

import pytest

from models.discount_program import DiscountProgram
from models.order import Order, OrderStatus, ScopeType, ServiceType
from utils.pricing import BASE_PRICES, SCOPE_MULTIPLIERS, calculate_price, find_best_discount


@pytest.mark.parametrize("service_type", list(ServiceType))
@pytest.mark.parametrize("scope", list(ScopeType))
def test_calculate_price_combinations(service_type, scope):
    result = calculate_price(service_type, scope)
    assert result["base_price"] == BASE_PRICES[service_type]
    assert result["scope_multiplier"] == SCOPE_MULTIPLIERS[scope]
    assert result["discount_percent"] == 0.0
    assert result["final_price"] == pytest.approx(BASE_PRICES[service_type] * SCOPE_MULTIPLIERS[scope])


def test_calculate_price_applies_discount():
    no_discount = calculate_price(ServiceType.web_design, ScopeType.large, 0.0)
    discounted = calculate_price(ServiceType.web_design, ScopeType.large, 20.0)
    assert discounted["discount_percent"] == 20.0
    assert discounted["final_price"] == pytest.approx(no_discount["final_price"] * 0.8)
    assert discounted["final_price"] == round(discounted["final_price"], 2)


def test_find_best_discount_returns_zero_when_no_programs(db, make_client):
    c = make_client()
    discount, program_id = find_best_discount(db, c.id)
    assert discount == 0.0
    assert program_id is None


def test_find_best_discount_ignores_inactive_programs(db, make_client):
    c = make_client()
    db.add(DiscountProgram(name="Inactive", min_completed_orders=0, discount_percent=50.0, is_active=False))
    db.commit()

    discount, program_id = find_best_discount(db, c.id)
    assert discount == 0.0
    assert program_id is None


def _make_done_order(db, client, n):
    pricing = calculate_price(ServiceType.copywriting, ScopeType.small)
    o = Order(
        client_id=client.id,
        title=f"Completed order {n}",
        service_type=ServiceType.copywriting,
        scope=ScopeType.small,
        status=OrderStatus.done,
        deadline=date.today() + timedelta(days=30),
        **pricing,
    )
    db.add(o)
    db.commit()
    return o


def test_find_best_discount_respects_threshold_and_picks_highest(db, make_client):
    c = make_client()
    bronze = DiscountProgram(name="Bronze", min_completed_orders=1, discount_percent=5.0, is_active=True)
    gold = DiscountProgram(name="Gold", min_completed_orders=3, discount_percent=15.0, is_active=True)
    db.add_all([bronze, gold])
    db.commit()

    # No completed orders yet -> below even the lowest threshold
    discount, program_id = find_best_discount(db, c.id)
    assert discount == 0.0
    assert program_id is None

    _make_done_order(db, c, 1)
    discount, program_id = find_best_discount(db, c.id)
    assert (discount, program_id) == (5.0, bronze.id)

    _make_done_order(db, c, 2)
    _make_done_order(db, c, 3)
    discount, program_id = find_best_discount(db, c.id)
    assert (discount, program_id) == (15.0, gold.id)
