import httpx
import pytest
import respx

from core.config import settings
from integrations import yookassa


@pytest.fixture(autouse=True)
def _yookassa_credentials(monkeypatch):
    monkeypatch.setattr(settings, "yookassa_shop_id", "shop-123")
    monkeypatch.setattr(settings, "yookassa_secret_key", "secret-456")


@respx.mock
def test_create_payment_sends_expected_request_and_parses_response():
    route = respx.post("https://api.yookassa.ru/v3/payments").mock(
        return_value=httpx.Response(
            200,
            json={"id": "pay-1", "status": "pending", "confirmation": {"confirmation_token": "tok-1"}},
        )
    )

    result = yookassa.create_payment(amount=100.5, description="Order #1", return_url="https://app/return")

    assert route.called
    request = route.calls[0].request
    assert request.headers["Idempotence-Key"]
    assert result["id"] == "pay-1"
    assert result["confirmation"]["confirmation_token"] == "tok-1"


@respx.mock
def test_fetch_payment_raises_on_http_error():
    respx.get("https://api.yookassa.ru/v3/payments/pay-1").mock(return_value=httpx.Response(404))

    with pytest.raises(httpx.HTTPStatusError):
        yookassa.fetch_payment("pay-1")
