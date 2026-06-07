def test_create_task_then_log_time(client, auth_headers, current_user):
    created = client.post(
        "/api/tasks",
        json={"title": "Write copy", "assigned_to_id": current_user.id},
        headers=auth_headers,
    )
    assert created.status_code == 201
    task_id = created.json()["id"]

    log = client.post(
        f"/api/tasks/{task_id}/time-logs",
        json={"hours": 2.5, "logged_at": "2026-06-01", "description": "Drafting"},
        headers=auth_headers,
    )
    assert log.status_code == 201
    assert log.json()["hours"] == 2.5

    logs = client.get(f"/api/tasks/{task_id}/time-logs", headers=auth_headers)
    assert logs.status_code == 200
    assert len(logs.json()) == 1


def test_delete_task_requires_admin(client, auth_headers, admin_headers):
    created = client.post("/api/tasks", json={"title": "To delete"}, headers=auth_headers)
    task_id = created.json()["id"]

    assert client.delete(f"/api/tasks/{task_id}", headers=auth_headers).status_code == 403
    assert client.delete(f"/api/tasks/{task_id}", headers=admin_headers).status_code == 204
