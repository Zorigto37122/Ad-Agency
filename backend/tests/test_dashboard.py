def test_dashboard_requires_admin_and_returns_data(client, auth_headers, admin_headers, make_order):
    make_order()
    assert client.get("/api/dashboard", headers=auth_headers).status_code == 403

    resp = client.get("/api/dashboard", headers=admin_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), dict)
