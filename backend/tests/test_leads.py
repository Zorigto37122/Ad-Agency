def test_leads_require_admin(client, auth_headers, admin_headers):
    payload = {"name": "Jane Prospect", "email": "jane@example.com"}
    assert client.post("/api/leads", json=payload, headers=auth_headers).status_code == 403
    assert client.get("/api/leads", headers=auth_headers).status_code == 403

    created = client.post("/api/leads", json=payload, headers=admin_headers)
    assert created.status_code == 201
    assert created.json()["status"] == "new"


def test_convert_lead_creates_client(client, admin_headers):
    created = client.post(
        "/api/leads", json={"name": "Future Client", "email": "future@example.com"}, headers=admin_headers
    ).json()

    resp = client.post(f"/api/leads/{created['id']}/convert", headers=admin_headers)
    assert resp.status_code == 200
    assert resp.json()["status"] == "won"

    clients = client.get("/api/clients", headers=admin_headers).json()
    assert any(c["email"] == "future@example.com" for c in clients)
