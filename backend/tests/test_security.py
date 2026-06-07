from datetime import timedelta

from core.security import (
    create_access_token,
    decode_token,
    get_password_hash,
    verify_password,
)


def test_password_hash_roundtrip():
    hashed = get_password_hash("super-secret")
    assert hashed != "super-secret"
    assert verify_password("super-secret", hashed) is True
    assert verify_password("wrong-password", hashed) is False


def test_create_and_decode_token_roundtrip():
    token = create_access_token({"sub": "42"})
    payload = decode_token(token)
    assert payload is not None
    assert payload["sub"] == "42"


def test_decode_expired_token_returns_none():
    token = create_access_token({"sub": "42"}, expires_delta=timedelta(minutes=-5))
    assert decode_token(token) is None


def test_decode_garbage_token_returns_none():
    assert decode_token("not-a-real-token") is None
