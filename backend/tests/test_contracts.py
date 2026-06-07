def test_create_contract_admin_only_then_get(client, auth_headers, admin_headers, make_client):
    c = make_client()
    payload = {"client_id": c.id, "title": "Service agreement"}
    assert client.post("/api/contracts", json=payload, headers=auth_headers).status_code == 403

    created = client.post("/api/contracts", json=payload, headers=admin_headers)
    assert created.status_code == 201

    resp = client.get(f"/api/contracts/{created.json()['id']}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["title"] == "Service agreement"


def test_get_contract_not_found(client, auth_headers):
    assert client.get("/api/contracts/999999", headers=auth_headers).status_code == 404
