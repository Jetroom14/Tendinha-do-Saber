"""End-to-end backend tests for Tendinha do Saber V2.0.
Covers: auth, books, schools, partners, cart, postcode, orders, vouchers,
wishlist, admin dashboard/users/logs/settings.
"""
import time
import uuid
from io import BytesIO

import pandas as pd
import requests
import pytest
from conftest import BASE_URL, auth_headers, SUPER_EMAIL, SUPER_PASSWORD, ADMIN_EMAIL, ADMIN_PASSWORD


def _books(api, **params):
    """Wrap /api/books to handle both legacy list response and new paginated dict."""
    qs = "&".join(f"{k}={v}" for k, v in params.items())
    data = api.get(f"{BASE_URL}/api/books?{qs}").json()
    if isinstance(data, dict) and "items" in data:
        return data["items"]
    return data



# ============================ AUTH ============================
class TestAuth:
    def test_super_admin_login(self, api):
        r = api.post(f"{BASE_URL}/api/auth/login", json={"email": SUPER_EMAIL, "password": SUPER_PASSWORD})
        assert r.status_code == 200, r.text
        data = r.json()
        assert "token" in data and isinstance(data["token"], str) and len(data["token"]) > 20
        assert data["user"]["role"] == "super_admin"
        assert data["user"]["email"] == SUPER_EMAIL.lower()
        assert "password_hash" not in data["user"]

    def test_admin_login(self, api):
        r = api.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["user"]["role"] == "admin"
        assert data["user"]["email"] == ADMIN_EMAIL.lower()

    def test_auth_me(self, api, super_token):
        r = api.get(f"{BASE_URL}/api/auth/me", headers=auth_headers(super_token))
        assert r.status_code == 200
        u = r.json()
        assert u["email"] == SUPER_EMAIL.lower()
        assert u["role"] == "super_admin"
        assert "password_hash" not in u

    def test_auth_me_no_token(self, api):
        r = api.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 401

    def test_register_customer(self, api):
        email = f"TEST_reg_{uuid.uuid4().hex[:8]}@example.com"
        r = api.post(f"{BASE_URL}/api/auth/register", json={
            "email": email, "password": "Test1234!", "name": "Reg Test"
        })
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["user"]["role"] == "customer"
        assert "token" in data

    def test_register_duplicate(self, api, customer):
        r = api.post(f"{BASE_URL}/api/auth/register", json={
            "email": customer["email"], "password": "Other123!", "name": "Dup"
        })
        assert r.status_code == 400

    def test_brute_force_lockout(self, api):
        # Unique email to avoid affecting other tests
        email = f"TEST_bf_{uuid.uuid4().hex[:8]}@example.com"
        # 5 wrong attempts then 6th should be 429
        for i in range(5):
            r = api.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": "wrong"})
            assert r.status_code == 401, f"Attempt {i + 1}: {r.status_code} {r.text}"
        r = api.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": "wrong"})
        assert r.status_code == 429, f"Expected lockout 429, got {r.status_code}: {r.text}"


# ============================ BOOKS / CATALOG ============================
class TestBooks:
    def test_list_books_seed_count(self, api):
        # /api/books page_size is server-capped at 200. Use `total` from paginated response.
        data = api.get(f"{BASE_URL}/api/books?limit=200").json()
        assert isinstance(data, dict) and "items" in data
        assert data["total"] >= 280, f"Expected ~291 seeded books, got total={data['total']}"
        books = data["items"]
        for b in books[:30]:
            assert len(b["isbn13"]) == 13, f"Bad ISBN: {b['isbn13']}"
            assert b["type"] in ("Manual", "Workbook")

    def test_books_filter_by_type_workbook(self, api):
        for b in _books(api, type="Workbook", limit=200):
            assert b["type"] == "Workbook"

    def test_books_filter_by_type_manual(self, api):
        for b in _books(api, type="Manual", limit=200):
            assert b["type"] == "Manual"

    def test_books_search_q(self, api):
        first = _books(api, limit=1)
        sample_title = first[0]["title"].split()[0]
        assert len(_books(api, q=sample_title)) > 0

    def test_books_filter_by_subject(self, api):
        subjects = api.get(f"{BASE_URL}/api/books/subjects").json()
        assert isinstance(subjects, list) and len(subjects) > 0
        sub = [s for s in subjects if s][0]
        for b in _books(api, subject=sub, limit=50):
            assert b["subject"] == sub

    def test_books_filter_school_grade(self, api):
        # Pick first school
        schools = api.get(f"{BASE_URL}/api/schools").json()
        assert len(schools) > 0
        sid = schools[0]["id"]
        # Pick a grade
        grades = api.get(f"{BASE_URL}/api/grade-levels").json()
        for g in grades:
            items = _books(api, school_id=sid, grade_level=g)
            if len(items) > 0:
                return
        pytest.fail("No books found for any school+grade combination")


# ============================ MUNICIPALITIES / SCHOOLS / GRADES ============================
class TestGeography:
    def test_municipalities_count(self, api):
        r = api.get(f"{BASE_URL}/api/municipalities")
        assert r.status_code == 200
        muns = r.json()
        names = {m["name"] for m in muns}
        for expected in ["Aveiro", "Ílhavo", "Vagos", "Águeda", "Oliveira do Bairro"]:
            assert expected in names, f"Missing {expected} in {names}"

    def test_schools_filter(self, api):
        muns = api.get(f"{BASE_URL}/api/municipalities").json()
        aveiro = next(m for m in muns if m["name"] == "Aveiro")
        r = api.get(f"{BASE_URL}/api/schools?municipality_id={aveiro['id']}")
        assert r.status_code == 200
        schools = r.json()
        assert len(schools) >= 1
        for s in schools:
            assert s["municipality_id"] == aveiro["id"]

    def test_grade_levels(self, api):
        r = api.get(f"{BASE_URL}/api/grade-levels")
        assert r.status_code == 200
        grades = r.json()
        assert len(grades) == 12

    def test_import_school_books_updates_school_grades(self, api, admin_token, super_token):
        mun_name = f"TEST Mun {uuid.uuid4().hex[:6]}"
        r = api.post(f"{BASE_URL}/api/admin/municipalities", headers=auth_headers(admin_token), json={"name": mun_name})
        assert r.status_code == 200, r.text
        mun_id = r.json()["id"]

        school_a = f"TEST School A {uuid.uuid4().hex[:6]}"
        r = api.post(f"{BASE_URL}/api/admin/schools", headers=auth_headers(super_token), json={"name": school_a, "municipality_id": mun_id})
        assert r.status_code == 200, r.text
        assert set(r.json()["grades_taught"]) == set(["1.º Ano", "2.º Ano", "3.º Ano", "4.º Ano", "5.º Ano", "6.º Ano", "7.º Ano", "8.º Ano", "9.º Ano", "10.º Ano", "11.º Ano", "12.º Ano"])

        school_b = f"TEST School B {uuid.uuid4().hex[:6]}"
        rows = [
            {"ISBN": "9781234567897", "Município": mun_name, "Escola": school_a, "Disciplina": "Português", "Ano": "9.º Ano"},
            {"ISBN": "9781234567898", "Município": mun_name, "Escola": school_b, "Disciplina": "Matemática", "Ano": "8.º Ano"},
        ]
        df = pd.DataFrame(rows)
        buffer = BytesIO()
        try:
            with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
                df.to_excel(writer, index=False)
        except ImportError:
            pytest.skip("openpyxl is required to generate Excel files for this test")
        buffer.seek(0)

        files = {"file": ("school_import.xlsx", buffer, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
        # Use raw requests.post (not the api session) — the session injects Content-Type: application/json
        # which corrupts the multipart boundary and makes FastAPI think file is missing.
        r = requests.post(
            f"{BASE_URL}/api/admin/school-books/import",
            headers=auth_headers(admin_token),
            files=files,
            timeout=60,
        )
        assert r.status_code == 200, r.text
        result = r.json()
        assert result["created_schools"] == 1
        assert result["created_links"] == 2
        assert result["anomalies"] == 0

        r = api.get(f"{BASE_URL}/api/schools?municipality_id={mun_id}")
        assert r.status_code == 200, r.text
        schools = {s["name"]: s for s in r.json()}
        assert school_a in schools
        assert school_b in schools
        assert set(schools[school_a]["grades_taught"]) == {"9.º Ano"}
        assert set(schools[school_b]["grades_taught"]) == {"8.º Ano"}


# ============================ PARTNERS ============================
class TestPartners:
    def test_partners_seed(self, api):
        r = api.get(f"{BASE_URL}/api/partners")
        assert r.status_code == 200
        partners = r.json()
        assert len(partners) >= 3
        codes = {p["promo_code"] for p in partners}
        for c in ["BEIRAMAR5", "VISTAALEGRE5", "ILIABUM5"]:
            assert c in codes


# ============================ CART / PROMO ============================
class TestCart:
    def test_cart_discount_only_on_workbooks(self, api):
        # Get one Manual and one Workbook
        manuals = _books(api, type="Manual", limit=1)
        workbooks = _books(api, type="Workbook", limit=1)
        assert manuals and workbooks
        m = manuals[0]
        w = workbooks[0]
        payload = {
            "items": [
                {"isbn13": m["isbn13"], "qty": 1, "lamination": False},
                {"isbn13": w["isbn13"], "qty": 1, "lamination": False},
            ],
            "promo_code": "BEIRAMAR5",
        }
        r = api.post(f"{BASE_URL}/api/cart/validate", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        # Manuals subtotal == manual price; no discount on manuals
        assert round(d["subtotal_manuals"], 2) == round(m["price"], 2)
        assert round(d["subtotal_workbooks"], 2) == round(w["price"], 2)
        expected_discount = round(w["price"] * 0.05, 2)
        assert abs(d["discount_workbooks"] - expected_discount) < 0.02, \
            f"Expected ~{expected_discount}, got {d['discount_workbooks']}"
        # Verify lines: manual has 0 discount, workbook has discount
        for line in d["lines"]:
            if line["type"] == "Manual":
                assert line["line_discount"] == 0, f"Discount applied to Manual: {line}"
            if line["type"] == "Workbook":
                assert line["line_discount"] > 0, f"No discount on Workbook: {line}"
        expected_total = round(m["price"] + w["price"] * 0.95, 2)
        assert abs(d["total"] - expected_total) < 0.05

    def test_cart_lamination_adds_to_manual(self, api):
        manuals = _books(api, type="Manual", limit=5)
        # find lamination-eligible manual
        m = next((b for b in manuals if b.get("is_lamination_eligible", True)), manuals[0])
        payload = {"items": [{"isbn13": m["isbn13"], "qty": 1, "lamination": True}]}
        r = api.post(f"{BASE_URL}/api/cart/validate", json=payload)
        assert r.status_code == 200
        d = r.json()
        lam_price = d.get("lamination_price", 2.0)
        assert abs(d["lamination_total"] - lam_price) < 0.01, f"lamination_total={d['lamination_total']}"
        # Total = price + lamination, no discount
        assert abs(d["total"] - (m["price"] + lam_price)) < 0.05


# ============================ POSTCODE ============================
class TestPostcode:
    def test_aveiro_postcode_ok(self, api):
        r = api.get(f"{BASE_URL}/api/postcode/check?code=3800")
        assert r.status_code == 200
        assert r.json()["hand_delivery_available"] is True

    def test_non_aveiro_postcode(self, api):
        r = api.get(f"{BASE_URL}/api/postcode/check?code=4000")
        assert r.status_code == 200
        assert r.json()["hand_delivery_available"] is False


# ============================ ORDERS ============================
class TestOrders:
    def test_create_order_and_fetch(self, api):
        books = _books(api, limit=2)
        payload = {
            "items": [{"isbn13": books[0]["isbn13"], "qty": 1, "lamination": False}],
            "promo_code": None,
            "customer_name": "TEST Buyer",
            "customer_email": "test_buyer@example.com",
            "customer_phone": "910000000",
            "delivery_method": "hand_delivery",
            "address": "Rua Teste 1",
            "postal_code": "3800",
            "notes": "TEST order",
        }
        r = api.post(f"{BASE_URL}/api/orders", json=payload)
        assert r.status_code == 200, r.text
        o = r.json()
        assert o["order_no"].startswith("TS-")
        assert o["status"] == "pending_payment"
        assert o["totals"]["total"] > 0
        # GET
        r2 = api.get(f"{BASE_URL}/api/orders/{o['order_no']}")
        assert r2.status_code == 200
        assert r2.json()["order_no"] == o["order_no"]

    def test_create_order_hand_delivery_outside_aveiro(self, api):
        books = _books(api, limit=1)
        payload = {
            "items": [{"isbn13": books[0]["isbn13"], "qty": 1, "lamination": False}],
            "customer_name": "TEST", "customer_email": "t@t.pt", "customer_phone": "910",
            "delivery_method": "hand_delivery",
            "postal_code": "4000",
            "address": "rua x",
        }
        r = api.post(f"{BASE_URL}/api/orders", json=payload)
        assert r.status_code == 400


# ============================ VOUCHERS ============================
class TestVouchers:
    def test_submit_voucher_public(self, api):
        r = api.post(f"{BASE_URL}/api/vouchers", json={
            "code": f"TEST{uuid.uuid4().hex[:6].upper()}", "notes": "TEST voucher"
        })
        assert r.status_code == 200, r.text
        v = r.json()
        assert v["status"] == "Pending"
        assert "id" in v

    def test_admin_list_and_update_voucher(self, api, admin_token):
        # Create
        code = f"TEST{uuid.uuid4().hex[:6].upper()}"
        r = api.post(f"{BASE_URL}/api/vouchers", json={"code": code, "notes": "TEST"})
        assert r.status_code == 200
        vid = r.json()["id"]
        # List
        r = api.get(f"{BASE_URL}/api/admin/vouchers", headers=auth_headers(admin_token))
        assert r.status_code == 200
        assert any(x["id"] == vid for x in r.json())
        # Update via form
        r = requests.put(f"{BASE_URL}/api/admin/vouchers/{vid}/status",
                         data={"status": "Validated"},
                         headers=auth_headers(admin_token))
        assert r.status_code == 200, r.text
        # Verify state changed
        r = api.get(f"{BASE_URL}/api/admin/vouchers", headers=auth_headers(admin_token))
        found = next((x for x in r.json() if x["id"] == vid), None)
        assert found and found["status"] == "Validated"


# ============================ ADMIN BOOKS CRUD ============================
class TestAdminBooks:
    def test_create_update_delete_book(self, api, admin_token):
        h = auth_headers(admin_token)
        h["Content-Type"] = "application/json"
        isbn = f"9999{uuid.uuid4().int % 10**9:09d}"[:13]
        payload = {
            "isbn13": isbn, "title": "TEST Manual", "author": "Tester",
            "publisher": "Tester Ed", "year": 2025, "subject": "Teste",
            "price": 19.99, "type": "Manual", "status": "Available",
            "stock_qty": 5, "is_lamination_eligible": True,
        }
        r = requests.post(f"{BASE_URL}/api/admin/books", json=payload, headers=h)
        assert r.status_code == 200, r.text
        created = r.json()
        assert created["isbn13"] == isbn

        # GET via public
        r = api.get(f"{BASE_URL}/api/books/{isbn}")
        assert r.status_code == 200
        assert r.json()["title"] == "TEST Manual"

        # UPDATE
        payload["title"] = "TEST Manual v2"
        payload["price"] = 21.50
        r = requests.put(f"{BASE_URL}/api/admin/books/{isbn}", json=payload, headers=h)
        assert r.status_code == 200
        r = api.get(f"{BASE_URL}/api/books/{isbn}")
        assert r.json()["title"] == "TEST Manual v2"
        assert r.json()["price"] == 21.50

        # DELETE
        r = requests.delete(f"{BASE_URL}/api/admin/books/{isbn}", headers=h)
        assert r.status_code == 200
        r = api.get(f"{BASE_URL}/api/books/{isbn}")
        assert r.status_code == 404


# ============================ ADMIN DASHBOARD / USERS / LOGS / SETTINGS ============================
class TestAdminPanel:
    def test_dashboard(self, api, admin_token):
        r = api.get(f"{BASE_URL}/api/admin/dashboard", headers=auth_headers(admin_token))
        assert r.status_code == 200
        d = r.json()
        assert d["total_books"] >= 280
        assert d["total_schools"] >= 8
        assert "pending_vouchers" in d
        assert isinstance(d["recent_orders"], list)

    def test_admin_users_forbidden_for_standard(self, api, admin_token):
        r = api.get(f"{BASE_URL}/api/admin/users", headers=auth_headers(admin_token))
        assert r.status_code == 403, f"Standard admin should not see users, got {r.status_code}"

    def test_admin_users_allowed_for_super(self, api, super_token):
        r = api.get(f"{BASE_URL}/api/admin/users", headers=auth_headers(super_token))
        assert r.status_code == 200
        users = r.json()
        assert isinstance(users, list) and len(users) >= 2
        for u in users:
            assert "password_hash" not in u

    def test_activity_logs(self, api, admin_token):
        r = api.get(f"{BASE_URL}/api/admin/activity-logs", headers=auth_headers(admin_token))
        assert r.status_code == 200
        logs = r.json()
        assert isinstance(logs, list)
        # Logs should exist from previous admin book CRUD test
        # (best-effort; don't fail if test order changes)

    def test_settings_lamination_price_persists(self, api, super_token):
        # NOTE: PUT /api/admin/settings is now restricted to super_admin only (iteration 2 change).
        h = auth_headers(super_token)
        h["Content-Type"] = "application/json"
        # Set to 3.00
        r = requests.put(f"{BASE_URL}/api/admin/settings", json={"lamination_price": 3.00}, headers=h)
        assert r.status_code == 200, r.text
        assert r.json()["lamination_price"] == 3.00

        # Cart should reflect new price
        manuals = _books(api, type="Manual", limit=5)
        m = next((b for b in manuals if b.get("is_lamination_eligible", True)), manuals[0])
        r = api.post(f"{BASE_URL}/api/cart/validate", json={
            "items": [{"isbn13": m["isbn13"], "qty": 1, "lamination": True}]
        })
        assert r.status_code == 200
        d = r.json()
        assert abs(d["lamination_total"] - 3.00) < 0.01, f"Expected 3.00 lamination, got {d['lamination_total']}"

        # Reset back to 2.00
        requests.put(f"{BASE_URL}/api/admin/settings", json={"lamination_price": 2.00}, headers=h)


# ============================ WISHLIST ============================
class TestWishlist:
    def test_wishlist_crud(self, api, customer):
        h = auth_headers(customer["token"])
        books = _books(api, limit=1)
        isbn = books[0]["isbn13"]
        # Add
        r = requests.post(f"{BASE_URL}/api/wishlist", json={"isbn13": isbn},
                          headers={**h, "Content-Type": "application/json"})
        assert r.status_code == 200, r.text
        # Get
        r = requests.get(f"{BASE_URL}/api/wishlist", headers=h)
        assert r.status_code == 200
        assert any(b["isbn13"] == isbn for b in r.json())
        # Remove
        r = requests.delete(f"{BASE_URL}/api/wishlist/{isbn}", headers=h)
        assert r.status_code == 200
        r = requests.get(f"{BASE_URL}/api/wishlist", headers=h)
        assert not any(b["isbn13"] == isbn for b in r.json())
