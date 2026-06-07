from datetime import timedelta

from core.security import create_access_token


def test_get_current_user_rejects_expired_or_garbage_token(client, current_user):
    expired = create_access_token({"sub": str(current_user.id)}, expires_delta=timedelta(minutes=-5))
    assert client.get("/api/auth/me", headers={"Authorization": f"Bearer {expired}"}).status_code == 401
    assert client.get("/api/auth/me", headers={"Authorization": "Bearer garbage"}).status_code == 401


def test_get_current_user_rejects_token_for_deleted_user(client, db, make_user):
    user, _ = make_user(email="ephemeral@example.com")
    token = create_access_token({"sub": str(user.id)})
    db.delete(user)
    db.commit()
    resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 401


def test_require_admin_allows_admin_rejects_regular_user(client, auth_headers, admin_headers):
    payload = {"name": "Co", "email": "co@example.com"}
    assert client.post("/api/clients", json=payload, headers=auth_headers).status_code == 403
    assert client.post("/api/clients", json=payload, headers=admin_headers).status_code == 201
