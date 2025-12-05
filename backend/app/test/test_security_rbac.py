"""
Tests for password strength validation and role-based access control.
"""
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

client = TestClient(app)


class TestPasswordValidation:
    """Test password strength requirements."""
    
    def test_password_too_short(self):
        """Password must be at least 8 characters."""
        r = client.post("/api/auth/register", json={
            "username": "shortpass",
            "password": "Short1!",
            "full_name": "Test User"
        })
        assert r.status_code == 400
        assert "at least 8 characters" in r.json()["detail"]
    
    def test_password_no_uppercase(self):
        """Password must contain uppercase letter."""
        r = client.post("/api/auth/register", json={
            "username": "noupper",
            "password": "nouppercase1!",
            "full_name": "Test User"
        })
        assert r.status_code == 400
        assert "uppercase letter" in r.json()["detail"]
    
    def test_password_no_lowercase(self):
        """Password must contain lowercase letter."""
        r = client.post("/api/auth/register", json={
            "username": "nolower",
            "password": "NOLOWERCASE1!",
            "full_name": "Test User"
        })
        assert r.status_code == 400
        assert "lowercase letter" in r.json()["detail"]
    
    def test_password_no_digit(self):
        """Password must contain digit."""
        r = client.post("/api/auth/register", json={
            "username": "nodigit",
            "password": "NoDigitPass!",
            "full_name": "Test User"
        })
        assert r.status_code == 400
        assert "digit" in r.json()["detail"]
    
    def test_password_no_special_char(self):
        """Password must contain special character."""
        r = client.post("/api/auth/register", json={
            "username": "nospecial",
            "password": "NoSpecial123",
            "full_name": "Test User"
        })
        assert r.status_code == 400
        assert "special character" in r.json()["detail"]
    
    def test_password_valid(self):
        """Valid password should work."""
        r = client.post("/api/auth/register", json={
            "username": "validuser",
            "password": "ValidPass123!",
            "full_name": "Test User"
        })
        assert r.status_code in (200, 201)


class TestRoleBasedAccess:
    """Test role-based access control."""
    
    @pytest.fixture(scope="class")
    def student_token(self):
        """Create a student user and get token."""
        client.post("/api/auth/register", json={
            "username": "student_user",
            "password": "Student123!",
            "role": "student",
            "full_name": "Student User"
        })
        r = client.post("/api/auth/login", json={
            "username": "student_user",
            "password": "Student123!"
        })
        return r.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def librarian_token(self):
        """Create a librarian user and get token."""
        client.post("/api/auth/register", json={
            "username": "librarian_user",
            "password": "Librarian123!",
            "role": "librarian",
            "full_name": "Librarian User"
        })
        r = client.post("/api/auth/login", json={
            "username": "librarian_user",
            "password": "Librarian123!"
        })
        return r.json()["access_token"]
    
    def test_student_cannot_add_book(self, student_token):
        """Students should not be able to add books."""
        headers = {"Authorization": f"Bearer {student_token}"}
        r = client.post("/api/books/", json={
            "title": "Test Book",
            "author": "Test Author",
            "isbn": "1234567890"
        }, headers=headers)
        assert r.status_code == 403
    
    def test_librarian_can_add_book(self, librarian_token):
        """Librarians should be able to add books."""
        headers = {"Authorization": f"Bearer {librarian_token}"}
        r = client.post("/api/books/", json={
            "title": "Test Book",
            "author": "Test Author",
            "isbn": "9876543210"
        }, headers=headers)
        assert r.status_code in (200, 201)
    
    def test_student_can_list_books(self, student_token):
        """Students should be able to list books."""
        headers = {"Authorization": f"Bearer {student_token}"}
        r = client.get("/api/books/", headers=headers)
        assert r.status_code == 200
    
    def test_unauthenticated_cannot_add_book(self):
        """Unauthenticated users should not be able to add books."""
        r = client.post("/api/books/", json={
            "title": "Test Book",
            "author": "Test Author",
            "isbn": "0000000000"
        })
        assert r.status_code == 403  # No auth header
