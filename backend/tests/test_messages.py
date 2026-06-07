def test_create_message_then_admin_lists_and_marks_read(client, auth_headers, admin_headers):
    created = client.post("/api/messages", json={"subject": "Help needed", "body": "Question about my order"}, headers=auth_headers)
    assert created.status_code == 201
    msg_id = created.json()["id"]

    assert client.get("/api/messages", headers=auth_headers).status_code == 403

    listed = client.get("/api/messages", headers=admin_headers)
    assert listed.status_code == 200
    assert any(m["id"] == msg_id for m in listed.json())

    marked = client.patch(f"/api/messages/{msg_id}/read", headers=admin_headers)
    assert marked.status_code == 200
    assert marked.json()["is_read"] is True


def test_unread_count_requires_admin(client, auth_headers, admin_headers):
    assert client.get("/api/messages/unread-count", headers=auth_headers).status_code == 403
    resp = client.get("/api/messages/unread-count", headers=admin_headers)
    assert resp.status_code == 200
    assert "count" in resp.json()
