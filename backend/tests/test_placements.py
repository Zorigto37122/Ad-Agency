from datetime import datetime, timedelta, timezone

from models.campaign import MediaChannel


def _make_channel(db):
    ch = MediaChannel(name="TV Prime", channel_type="display")
    db.add(ch)
    db.commit()
    db.refresh(ch)
    return ch


def test_create_placement_admin_only_and_get(client, db, auth_headers, admin_headers, make_campaign):
    camp = make_campaign()
    channel = _make_channel(db)
    payload = {
        "campaign_id": camp.id,
        "channel_id": channel.id,
        "scheduled_at": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(),
        "cost_per_slot": 100.0,
    }
    assert client.post("/api/placements", json=payload, headers=auth_headers).status_code == 403

    created = client.post("/api/placements", json=payload, headers=admin_headers)
    assert created.status_code == 201

    resp = client.get(f"/api/placements/{created.json()['id']}", headers=auth_headers)
    assert resp.status_code == 200


def test_get_placement_not_found(client, auth_headers):
    assert client.get("/api/placements/999999", headers=auth_headers).status_code == 404


def test_calendar_entry_create_requires_admin(client, auth_headers, admin_headers, make_campaign):
    camp = make_campaign()
    payload = {"campaign_id": camp.id, "title": "Promo post", "content_type": "image", "scheduled_date": "2026-07-01"}
    assert client.post("/api/content-calendar", json=payload, headers=auth_headers).status_code == 403
    assert client.post("/api/content-calendar", json=payload, headers=admin_headers).status_code == 201
