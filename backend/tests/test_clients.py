def test_list_clients_requires_auth(client):
    assert client.get("/api/clients").status_code == 403


def test_create_client_admin_only_and_rejects_duplicate_email(client, auth_headers, admin_headers, make_client):
    payload = {"name": "New Co", "email": "newco@example.com"}
    assert client.post("/api/clients", json=payload, headers=auth_headers).status_code == 403

    resp = client.post("/api/clients", json=payload, headers=admin_headers)
    assert resp.status_code == 201
    assert resp.json()["order_count"] == 0

    dup = client.post("/api/clients", json=payload, headers=admin_headers)
    assert dup.status_code == 400


def test_get_client_detail_includes_orders_or_404(client, auth_headers, make_order):
    order = make_order()
    resp = client.get(f"/api/clients/{order.client_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["order_count"] == 1

    assert client.get("/api/clients/999999", headers=auth_headers).status_code == 404


def test_delete_client_admin_only(client, auth_headers, admin_headers, make_client):
    c = make_client()
    assert client.delete(f"/api/clients/{c.id}", headers=auth_headers).status_code == 403
    assert client.delete(f"/api/clients/{c.id}", headers=admin_headers).status_code == 204
