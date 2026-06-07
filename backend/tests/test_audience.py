def test_create_segment_admin_only_then_get(client, auth_headers, admin_headers):
    payload = {"name": "Young professionals", "age_min": 25, "age_max": 35}
    assert client.post("/api/segments", json=payload, headers=auth_headers).status_code == 403

    created = client.post("/api/segments", json=payload, headers=admin_headers)
    assert created.status_code == 201

    resp = client.get(f"/api/segments/{created.json()['id']}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["name"] == "Young professionals"


def test_get_segment_not_found(client, auth_headers):
    assert client.get("/api/segments/999999", headers=auth_headers).status_code == 404
