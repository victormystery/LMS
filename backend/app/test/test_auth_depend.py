import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_register_login_and_me():
    username = "testuser123"
    password = "secret123"
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
    token = token_data["access_token"]

    # Use token to get /me
    headers = {"Authorization": f"Bearer {token}"}
    r = client.get("/api/users/me", headers=headers)
    assert r.status_code == 200
    me = r.json()
    assert me.get("username") == username
