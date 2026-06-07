def test_create_vendor_admin_only_then_list(client, auth_headers, admin_headers):
    payload = {"name": "Print House LLC", "specialty": "printing"}
    assert client.post("/api/vendors", json=payload, headers=auth_headers).status_code == 403

    created = client.post("/api/vendors", json=payload, headers=admin_headers)
    assert created.status_code == 201

    listed = client.get("/api/vendors", headers=auth_headers)
    assert any(v["name"] == "Print House LLC" for v in listed.json())


def test_get_vendor_not_found(client, auth_headers):
    assert client.get("/api/vendors/999999", headers=auth_headers).status_code == 404
