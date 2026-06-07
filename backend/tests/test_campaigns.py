def test_create_campaign_admin_only(client, auth_headers, admin_headers, make_order):
    order = make_order()
    payload = {"order_id": order.id, "name": "Spring Launch", "budget": 1000.0}

    assert client.post("/api/campaigns", json=payload, headers=auth_headers).status_code == 403

    resp = client.post("/api/campaigns", json=payload, headers=admin_headers)
    assert resp.status_code == 201
    assert resp.json()["name"] == "Spring Launch"


def test_get_campaign_not_found(client, auth_headers):
    assert client.get("/api/campaigns/999999", headers=auth_headers).status_code == 404


def test_list_and_create_media_channels(client, auth_headers, admin_headers):
    payload = {"name": "Instagram Ads", "channel_type": "social_media"}
    assert client.post("/api/channels", json=payload, headers=auth_headers).status_code == 403

    created = client.post("/api/channels", json=payload, headers=admin_headers)
    assert created.status_code == 201

    listed = client.get("/api/channels", headers=auth_headers)
    assert listed.status_code == 200
    assert any(ch["name"] == "Instagram Ads" for ch in listed.json())
