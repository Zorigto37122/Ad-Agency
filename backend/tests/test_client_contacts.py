def test_create_contact_admin_only_then_get(client, auth_headers, admin_headers, make_client):
    c = make_client()
    payload = {"client_id": c.id, "name": "Ivan Petrov", "email": "ivan@example.com", "is_primary": True}
    assert client.post("/api/client-contacts", json=payload, headers=auth_headers).status_code == 403

    created = client.post("/api/client-contacts", json=payload, headers=admin_headers)
    assert created.status_code == 201

    resp = client.get(f"/api/client-contacts/{created.json()['id']}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["is_primary"] is True


def test_get_contact_not_found(client, auth_headers):
    assert client.get("/api/client-contacts/999999", headers=auth_headers).status_code == 404
