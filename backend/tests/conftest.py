import itertools
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database import Base
from core.dependencies import get_db
from core.security import get_password_hash
from main import app
from models.user import User
from models.client import Client
from models.order import Order, ServiceType, ScopeType
from models.campaign import Campaign
from utils.pricing import calculate_price


@pytest.fixture()
def db():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


@pytest.fixture()
def client(db):
    def _override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture(autouse=True)
def _no_celery(monkeypatch):
    """Prevent router tests from trying to talk to a real Celery broker."""
    from tasks import email_tasks

    monkeypatch.setattr(email_tasks.send_order_notification, "delay", MagicMock())
    monkeypatch.setattr(email_tasks.send_payment_confirmation, "delay", MagicMock())


_user_seq = itertools.count(1)
_client_seq = itertools.count(1)
_order_seq = itertools.count(1)
_campaign_seq = itertools.count(1)


@pytest.fixture()
def make_user(db):
    def _make(*, email=None, password="password123", is_admin=False, full_name="Test User"):
        n = next(_user_seq)
        u = User(
            email=email or f"user{n}@example.com",
            full_name=full_name,
            hashed_password=get_password_hash(password),
            is_admin=is_admin,
        )
        db.add(u)
        db.commit()
        db.refresh(u)
        return u, password

    return _make


@pytest.fixture()
def make_auth_headers(client, make_user):
    def _make(*, is_admin=False, **kwargs):
        u, password = make_user(is_admin=is_admin, **kwargs)
        resp = client.post("/api/auth/login", json={"email": u.email, "password": password})
        assert resp.status_code == 200, resp.text
        token = resp.json()["access_token"]
        return u, {"Authorization": f"Bearer {token}"}

    return _make


@pytest.fixture()
def user_and_headers(make_auth_headers):
    return make_auth_headers(is_admin=False)


@pytest.fixture()
def current_user(user_and_headers):
    return user_and_headers[0]


@pytest.fixture()
def auth_headers(user_and_headers):
    return user_and_headers[1]


@pytest.fixture()
def admin_and_headers(make_auth_headers):
    return make_auth_headers(is_admin=True)


@pytest.fixture()
def admin_user(admin_and_headers):
    return admin_and_headers[0]


@pytest.fixture()
def admin_headers(admin_and_headers):
    return admin_and_headers[1]


@pytest.fixture()
def make_client(db):
    def _make(**kwargs):
        n = next(_client_seq)
        defaults = dict(
            name=f"Client {n}",
            email=f"client{n}@example.com",
            phone="+70000000000",
            company="ACME",
        )
        defaults.update(kwargs)
        c = Client(**defaults)
        db.add(c)
        db.commit()
        db.refresh(c)
        return c

    return _make


@pytest.fixture()
def make_order(db, make_client):
    def _make(*, client=None, created_by=None, **kwargs):
        n = next(_order_seq)
        if client is None:
            client = make_client()
        service_type = kwargs.pop("service_type", ServiceType.web_design)
        scope = kwargs.pop("scope", ScopeType.medium)
        pricing = calculate_price(service_type, scope, 0.0)
        defaults = dict(
            client_id=client.id,
            title=f"Order {n}",
            service_type=service_type,
            scope=scope,
            created_by_id=created_by.id if created_by else None,
            **pricing,
        )
        defaults.update(kwargs)
        o = Order(**defaults)
        db.add(o)
        db.commit()
        db.refresh(o)
        return o

    return _make


@pytest.fixture()
def make_campaign(db, make_order):
    def _make(*, order=None, **kwargs):
        n = next(_campaign_seq)
        if order is None:
            order = make_order()
        defaults = dict(order_id=order.id, name=f"Campaign {n}", budget=1000.0)
        defaults.update(kwargs)
        camp = Campaign(**defaults)
        db.add(camp)
        db.commit()
        db.refresh(camp)
        return camp

    return _make
