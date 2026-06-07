def test_discount_programs_require_admin_and_create(client, auth_headers, admin_headers):
    payload = {"name": "Loyalty 10%", "min_completed_orders": 3, "discount_percent": 10.0}
    assert client.get("/api/discounts", headers=auth_headers).status_code == 403
    assert client.post("/api/discounts", json=payload, headers=auth_headers).status_code == 403

    created = client.post("/api/discounts", json=payload, headers=admin_headers)
    assert created.status_code == 201
    assert created.json()["discount_percent"] == 10.0


def test_update_and_delete_discount_program(client, admin_headers):
    created = client.post(
        "/api/discounts",
        json={"name": "Temp", "min_completed_orders": 1, "discount_percent": 5.0},
        headers=admin_headers,
    ).json()

    updated = client.put(f"/api/discounts/{created['id']}", json={"is_active": False}, headers=admin_headers)
    assert updated.status_code == 200
    assert updated.json()["is_active"] is False

    assert client.delete(f"/api/discounts/{created['id']}", headers=admin_headers).status_code == 204
