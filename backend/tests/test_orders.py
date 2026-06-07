from utils.pricing import calculate_price


def test_create_order_calculates_price(client, auth_headers, make_client):
    c = make_client()
    resp = client.post(
        "/api/orders",
        json={"client_id": c.id, "title": "Landing page", "service_type": "web_design", "scope": "large"},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    pricing = calculate_price("web_design", "large", 0.0)
    assert body["final_price"] == pricing["final_price"]
    assert body["status"] == "pending"


def test_get_order_forbidden_for_non_owner_allowed_for_admin(client, auth_headers, admin_headers, make_order, make_user):
    other_user, _ = make_user()
    order = make_order(created_by=other_user)

    assert client.get(f"/api/orders/{order.id}", headers=auth_headers).status_code == 403
    assert client.get(f"/api/orders/{order.id}", headers=admin_headers).status_code == 200


def test_delete_order_not_found(client, auth_headers):
    assert client.delete("/api/orders/999999", headers=auth_headers).status_code == 404
