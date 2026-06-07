from datetime import date, datetime, timezone

from models.payment import Invoice


def _make_invoice(db, order, **kwargs):
    defaults = dict(order_id=order.id, issue_date=date.today(), due_date=date.today(), amount=1000.0)
    defaults.update(kwargs)
    inv = Invoice(**defaults)
    db.add(inv)
    db.commit()
    db.refresh(inv)
    return inv


def test_create_invoice_admin_only(client, auth_headers, admin_headers, make_order):
    order = make_order()
    payload = {"order_id": order.id, "issue_date": "2026-01-01", "due_date": "2026-02-01", "amount": 500.0}

    assert client.post("/api/invoices", json=payload, headers=auth_headers).status_code == 403

    resp = client.post("/api/invoices", json=payload, headers=admin_headers)
    assert resp.status_code == 201
    assert resp.json()["amount"] == 500.0


def test_add_payment_triggers_confirmation_task(client, db, admin_headers, make_order):
    invoice = _make_invoice(db, make_order())
    payload = {
        "payment_date": datetime.now(timezone.utc).isoformat(),
        "amount": 1000.0,
        "method": "card",
    }
    resp = client.post(f"/api/invoices/{invoice.id}/payments", json=payload, headers=admin_headers)
    assert resp.status_code == 201
    assert resp.json()["status"] == "pending"

    from tasks.email_tasks import send_payment_confirmation
    send_payment_confirmation.delay.assert_called_once_with(resp.json()["id"])


def test_initiate_payment_returns_503_when_yookassa_not_configured(client, db, auth_headers, make_order):
    invoice = _make_invoice(db, make_order())
    resp = client.post(f"/api/invoices/{invoice.id}/pay", json={}, headers=auth_headers)
    assert resp.status_code == 503


def test_get_invoice_not_found(client, auth_headers):
    assert client.get("/api/invoices/999999", headers=auth_headers).status_code == 404
