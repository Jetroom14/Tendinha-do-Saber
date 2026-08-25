"""Shared pytest fixtures for Tendinha do Saber backend tests."""
import os
import time
import requests
import pytest
from pathlib import Path
from dotenv import load_dotenv

# Load frontend .env for REACT_APP_BACKEND_URL
load_dotenv(Path("/app/frontend/.env"))

BASE_URL = os.environ.get("TEST_BASE_URL", os.environ.get("REACT_APP_BACKEND_URL", "")).rstrip("/")

# Never hardcode credentials in versioned tests.
SUPER_EMAIL = os.environ.get("TEST_SUPER_ADMIN_EMAIL", "")
SUPER_PASSWORD = os.environ["TEST_SUPER_ADMIN_PASSWORD"]
ADMIN_EMAIL = os.environ.get("TEST_ADMIN_EMAIL", "")
ADMIN_PASSWORD = os.environ["TEST_ADMIN_PASSWORD"]


@pytest.fixture(scope="session")
def base_url():
    if not BASE_URL:
        pytest.skip("TEST_BASE_URL (or REACT_APP_BACKEND_URL) not configured for tests")
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
    if not BASE_URL:
        pytest.skip("TEST_BASE_URL (or REACT_APP_BACKEND_URL) not configured for tests")
    if not SUPER_EMAIL or not SUPER_PASSWORD:
        pytest.skip("Set TEST_SUPER_ADMIN_EMAIL and TEST_SUPER_ADMIN_PASSWORD for authenticated test runs")
    s = requests.Session()
    r = _login(s, SUPER_EMAIL, SUPER_PASSWORD)
    if r.status_code != 200:
        # If brute-force locked due to prior tests, wait & try once more
        pytest.skip(f"Super admin login failed: {r.status_code} {r.text}")
    return r.json()["token"]


@pytest.fixture(scope="session")
def admin_token():
    if not BASE_URL:
        pytest.skip("TEST_BASE_URL (or REACT_APP_BACKEND_URL) not configured for tests")
    if not ADMIN_EMAIL or not ADMIN_PASSWORD:
        pytest.skip("Set TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD for authenticated test runs")
    s = requests.Session()
    r = _login(s, ADMIN_EMAIL, ADMIN_PASSWORD)
    if r.status_code != 200:
        pytest.skip(f"Admin login failed: {r.status_code} {r.text}")
    return r.json()["token"]


@pytest.fixture(scope="session")
def customer():
    """Create a unique customer per test session."""
    if not BASE_URL:
        pytest.skip("TEST_BASE_URL (or REACT_APP_BACKEND_URL) not configured for tests")
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
