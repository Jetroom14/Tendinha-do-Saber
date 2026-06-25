"""Shared pytest fixtures for Tendinha do Saber backend tests."""
import os
import time
import requests
import pytest
from pathlib import Path
from dotenv import load_dotenv

# Load frontend .env for REACT_APP_BACKEND_URL
load_dotenv(Path("/app/frontend/.env"))

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")

SUPER_EMAIL = "jetroortej14@hotmail.com"
SUPER_PASSWORD = "ChangeMe!2026Super"
ADMIN_EMAIL = "tendinhadosaber@gmail.com"
ADMIN_PASSWORD = "ChangeMe!2026Admin"


@pytest.fixture(scope="session")
def base_url():
    return BASE_URL


@pytest.fixture
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def _login(session, email, password):
    r = session.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": password}, timeout=30)
    return r


@pytest.fixture(scope="session")
def super_token():
    s = requests.Session()
    r = _login(s, SUPER_EMAIL, SUPER_PASSWORD)
    if r.status_code != 200:
        # If brute-force locked due to prior tests, wait & try once more
        pytest.skip(f"Super admin login failed: {r.status_code} {r.text}")
    return r.json()["token"]


@pytest.fixture(scope="session")
def admin_token():
    s = requests.Session()
    r = _login(s, ADMIN_EMAIL, ADMIN_PASSWORD)
    if r.status_code != 200:
        pytest.skip(f"Admin login failed: {r.status_code} {r.text}")
    return r.json()["token"]


@pytest.fixture(scope="session")
def customer():
    """Create a unique customer per test session."""
    s = requests.Session()
    email = f"test_customer_{int(time.time())}@example.com"
    password = "TestPass123!"
    r = s.post(f"{BASE_URL}/api/auth/register", json={
        "email": email,
        "password": password,
        "name": "TEST Customer",
    }, timeout=30)
    assert r.status_code == 200, f"Customer register failed: {r.text}"
    data = r.json()
    return {"email": email, "password": password, "token": data["token"], "user": data["user"]}


def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}
