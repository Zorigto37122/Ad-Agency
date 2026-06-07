def test_create_and_list_variants(client, auth_headers, admin_headers, make_campaign):
    camp = make_campaign()
    payload = {"name": "Variant A", "description": "Blue button"}
    assert client.post(f"/api/campaigns/{camp.id}/variants", json=payload, headers=auth_headers).status_code == 403

    created = client.post(f"/api/campaigns/{camp.id}/variants", json=payload, headers=admin_headers)
    assert created.status_code == 201

    listed = client.get(f"/api/campaigns/{camp.id}/variants", headers=auth_headers)
    assert listed.status_code == 200
    assert any(v["name"] == "Variant A" for v in listed.json())


def test_declare_winner(client, admin_headers, make_campaign):
    camp = make_campaign()
    variant = client.post(
        f"/api/campaigns/{camp.id}/variants",
        json={"name": "Variant B", "description": "Red button"},
        headers=admin_headers,
    ).json()

    resp = client.post(f"/api/campaigns/{camp.id}/variants/{variant['id']}/declare-winner", headers=admin_headers)
    assert resp.status_code == 200
    assert resp.json()["is_winner"] is True
