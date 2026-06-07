import uuid
from typing import Optional

import httpx

from core.config import settings

API_BASE = "https://api.yookassa.ru/v3"


def _auth() -> tuple[str, str]:
    return (settings.yookassa_shop_id, settings.yookassa_secret_key)


def create_payment(amount: float, description: str, return_url: str, metadata: Optional[dict] = None) -> dict:
    """Create a payment with an embedded confirmation widget.

    Returns the YooKassa payment object — caller needs `id` (to store as
    transaction_ref) and `confirmation.confirmation_token` (to render the widget).
    """
    payload = {
        "amount": {"value": f"{amount:.2f}", "currency": "RUB"},
        "capture": True,
        "description": description,
        "confirmation": {"type": "embedded", "return_url": return_url},
        "metadata": metadata or {},
    }
    resp = httpx.post(
        f"{API_BASE}/payments",
        json=payload,
        auth=_auth(),
        headers={"Idempotence-Key": str(uuid.uuid4())},
        timeout=15.0,
    )
    resp.raise_for_status()
    return resp.json()


def fetch_payment(payment_id: str) -> dict:
    """Fetch the authoritative payment status directly from YooKassa.

    Webhook bodies must not be trusted as-is — always re-fetch by id so a
    forged notification can't mark an invoice as paid.
    """
    resp = httpx.get(f"{API_BASE}/payments/{payment_id}", auth=_auth(), timeout=15.0)
    resp.raise_for_status()
    return resp.json()
