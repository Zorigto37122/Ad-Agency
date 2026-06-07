def test_monitoring_requires_admin_and_returns_data(client, auth_headers, admin_headers):
    assert client.get("/api/monitoring", headers=auth_headers).status_code == 403

    resp = client.get("/api/monitoring", headers=admin_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), dict)
