def test_register_then_login(client):
    resp = client.post(
        "/api/auth/register",
        json={"email": "new@example.com", "full_name": "New User", "password": "secret123"},
    )
    assert resp.status_code == 201
    assert "hashed_password" not in resp.json()

    login = client.post("/api/auth/login", json={"email": "new@example.com", "password": "secret123"})
    assert login.status_code == 200
    assert login.json()["access_token"]


def test_register_duplicate_email_returns_400(client, make_user):
    user, _ = make_user(email="dup@example.com")
    resp = client.post(
        "/api/auth/register",
        json={"email": "dup@example.com", "full_name": "Dup User", "password": "secret123"},
    )
    assert resp.status_code == 400


def test_login_wrong_password_returns_401(client, make_user):
    user, _ = make_user(email="wrongpass@example.com")
    resp = client.post("/api/auth/login", json={"email": user.email, "password": "incorrect"})
    assert resp.status_code == 401


def test_get_me_returns_current_user(client, current_user, auth_headers):
    resp = client.get("/api/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["email"] == current_user.email
