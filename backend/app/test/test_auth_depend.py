import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.app.db.session import engine
from backend.app.db import base

# Ensure database tables are created before tests
@pytest.fixture(scope="module", autouse=True)
def setup_database():
    base.Base.metadata.create_all(bind=engine)
    yield
    # Optional: Clean up after tests
    # base.Base.metadata.drop_all(bind=engine)

client = TestClient(app)


def test_register_login():
    username = "testuser123"
    password = "SecurePass123!"  # Strong password with uppercase, lowercase, digit, and special char
    # Register
    r = client.post("/api/auth/register", json={"username": username, "full_name": "Test User", "password": password})
    assert r.status_code in (200, 201)
    data = r.json()
    assert data.get("username") == username

    # Login
    r = client.post("/api/auth/login", json={"username": username, "password": password})
    assert r.status_code == 200
    token_data = r.json()
    assert "access_token" in token_data
    assert "user" in token_data
    assert token_data["user"]["username"] == username
