"""Iteration 2 backend tests for Tendinha do Saber V2.0.

Covers the new functionality added in this iteration:
- 19 Aveiro municipalities
- Schools cascade filter by grade (EB1 vs Secundária)
- SEO sitemap.xml + tracking + robots.txt
- Voucher PDF upload (private, admin-only download)
- Expanded Aveiro postcode geofencing (3700 included)
- Admin enrich-covers endpoint
- Partners logos + promo codes (internal use)
"""

import io
import uuid

import requests
import pytest

from conftest import (
    BASE_URL,
    auth_headers,
    SUPER_EMAIL,
    SUPER_PASSWORD,
    ADMIN_EMAIL,
    ADMIN_PASSWORD,
)


# ============================ MUNICIPALITIES: 19 Aveiro concelhos ============================
EXPECTED_MUNS = [
    "Águeda", "Albergaria-a-Velha", "Anadia", "Arouca", "Aveiro",
    "Castelo de Paiva", "Espinho", "Estarreja", "Ílhavo", "Mealhada",
    "Murtosa", "Oliveira de Azeméis", "Oliveira do Bairro", "Ovar",
    "Santa Maria da Feira", "São João da Madeira", "Sever do Vouga",
    "Vagos", "Vale de Cambra",
]


class TestMunicipalities:
    def test_19_aveiro_municipalities(self, api):
        r = api.get(f"{BASE_URL}/api/municipalities")
        assert r.status_code == 200, r.text
        muns = r.json()
        names = {m["name"] for m in muns}
        missing = [n for n in EXPECTED_MUNS if n not in names]
        assert not missing, f"Missing concelhos: {missing}. Got names={sorted(names)}"
        # Every entry must have id + name
        for m in muns:
            assert m.get("id")
            assert m.get("name")


# ============================ SCHOOLS: cascade filter by grade ============================
class TestSchoolsGradeFilter:
    def _aveiro_id(self, api):
        muns = api.get(f"{BASE_URL}/api/municipalities").json()
        return next(m for m in muns if m["name"] == "Aveiro")["id"]

    def test_schools_total_count(self, api):
        r = api.get(f"{BASE_URL}/api/schools")
        assert r.status_code == 200
        schools = r.json()
        assert len(schools) >= 40, f"Expected ~50 schools, got {len(schools)}"
        for s in schools[:10]:
            assert "grades_taught" in s
            assert isinstance(s["grades_taught"], list)

    def test_aveiro_grade_4_returns_only_eb1(self, api):
        aveiro_id = self._aveiro_id(api)
        r = api.get(f"{BASE_URL}/api/schools?municipality_id={aveiro_id}&grade=4.º Ano")
        assert r.status_code == 200, r.text
        schools = r.json()
        assert len(schools) >= 1, "Expected at least one EB1 school in Aveiro for 4.º Ano"
        bad = []
        for s in schools:
            name_lower = s["name"].lower()
            # EB1 schools should NOT have secundária / EB2,3 markers (unless agrupamento)
            if "secund" in name_lower:
                bad.append(s["name"])
            if "eb 2,3" in name_lower or "eb2,3" in name_lower:
                bad.append(s["name"])
            # And grades_taught MUST contain 4.º Ano
            assert "4.º Ano" in s["grades_taught"], (
                f"School {s['name']} listed for 4.º Ano but grades_taught={s['grades_taught']}"
            )
        assert not bad, f"Secondary/EB2,3 schools incorrectly returned for 4.º Ano: {bad}"

    def test_aveiro_grade_10_returns_only_secondary(self, api):
        aveiro_id = self._aveiro_id(api)
        r = api.get(f"{BASE_URL}/api/schools?municipality_id={aveiro_id}&grade=10.º Ano")
        assert r.status_code == 200, r.text
        schools = r.json()
        assert len(schools) >= 1, "Expected at least one secondary school in Aveiro for 10.º Ano"
        for s in schools:
            assert "10.º Ano" in s["grades_taught"], (
                f"School {s['name']} listed for 10.º Ano but grades_taught={s['grades_taught']}"
            )
            # No EB1-only school should appear
            name_lower = s["name"].lower()
            assert not name_lower.startswith("eb 1"), f"EB1 school returned for 10.º Ano: {s['name']}"


# ============================ SEO: sitemap, tracking, robots ============================
class TestSEO:
    def test_sitemap_xml(self, api):
        r = api.get(f"{BASE_URL}/api/seo/sitemap.xml")
        assert r.status_code == 200, r.text
        ctype = r.headers.get("content-type", "")
        assert "application/xml" in ctype, f"Expected xml content-type, got {ctype}"
        body = r.text
        assert body.startswith("<?xml"), "Sitemap should start with XML declaration"
        assert "<urlset" in body
        # static pages
        for path in ["/catalogo", "/parceiros", "/vouchers", "/sobre"]:
            assert path in body, f"Missing {path} in sitemap"
        # at least one book URL
        assert "/livro/" in body, "Sitemap should include book URLs"

    def test_robots_txt_frontend_static(self, api):
        # robots.txt is served by the frontend (static); fetch via public origin.
        # Use BASE_URL with /robots.txt (frontend prefix routing).
        base_no_api = BASE_URL.rstrip("/")
        r = requests.get(f"{base_no_api}/robots.txt", timeout=15)
        assert r.status_code == 200, f"robots.txt not served: {r.status_code}"
        body = r.text
        assert "User-agent" in body
        assert "Sitemap:" in body, f"robots.txt missing Sitemap directive. Body:\n{body}"

    def test_seo_tracking_default(self, api):
        r = api.get(f"{BASE_URL}/api/seo/tracking")
        assert r.status_code == 200, r.text
        d = r.json()
        for key in ("google_analytics_id", "google_ads_id", "facebook_pixel_id", "google_site_verification"):
            assert key in d, f"Missing tracking key {key} in response: {d}"

    def test_seo_tracking_persists_after_settings_update(self, api, super_token):
        h = auth_headers(super_token)
        h["Content-Type"] = "application/json"
        token_id = f"G-TEST{uuid.uuid4().hex[:6].upper()}"
        try:
            r = requests.put(
                f"{BASE_URL}/api/admin/settings",
                json={"google_analytics_id": token_id},
                headers=h, timeout=20,
            )
            assert r.status_code == 200, r.text
            # Now fetch the public tracking config
            r = api.get(f"{BASE_URL}/api/seo/tracking")
            assert r.status_code == 200
            assert r.json()["google_analytics_id"] == token_id
        finally:
            # Best-effort cleanup: restore to empty string
            requests.put(
                f"{BASE_URL}/api/admin/settings",
                json={"google_analytics_id": ""},
                headers=h, timeout=20,
            )


# ============================ VOUCHER PDF UPLOAD ============================
def _pdf_bytes(size_kb: int = 2) -> bytes:
    """Build a minimal valid PDF magic-byte payload of approx size_kb."""
    header = b"%PDF-1.4\n%\xE2\xE3\xCF\xD3\n"
    filler = b"% test padding payload\n" * (max(1, (size_kb * 1024) // 23))
    trailer = b"%%EOF\n"
    return header + filler + trailer


class TestVoucherUpload:
    def test_upload_valid_pdf_creates_voucher(self, api):
        code = f"TEST{uuid.uuid4().hex[:6].upper()}"
        files = {"file": ("test.pdf", _pdf_bytes(4), "application/pdf")}
        data = {"code": code, "notes": "TEST voucher pdf"}
        r = requests.post(f"{BASE_URL}/api/vouchers/upload", files=files, data=data, timeout=30)
        assert r.status_code == 200, r.text
        v = r.json()
        assert v["status"] == "Pending"
        assert v.get("pdf_storage_path"), "Expected pdf_storage_path to be set"
        assert v["code"] == code

    def test_upload_rejects_non_pdf(self, api):
        files = {"file": ("malicious.pdf", b"hello world not a pdf", "application/pdf")}
        r = requests.post(f"{BASE_URL}/api/vouchers/upload", files=files,
                          data={"code": f"TEST{uuid.uuid4().hex[:4].upper()}"}, timeout=30)
        assert r.status_code == 400, f"Expected 400 for non-PDF body, got {r.status_code}: {r.text}"

    def test_upload_rejects_oversize(self, api):
        # Limit in server is 8MB (constant VOUCHER_MAX_BYTES = 8*1024*1024). Use ~9MB to exceed it.
        # NOTE: PRD wanted 5MB cap but server uses 8MB. Flagged in test report.
        big = b"%PDF-1.4\n" + (b"A" * (9 * 1024 * 1024))
        files = {"file": ("big.pdf", big, "application/pdf")}
        r = requests.post(f"{BASE_URL}/api/vouchers/upload", files=files,
                          data={"code": f"TEST{uuid.uuid4().hex[:4].upper()}"}, timeout=120)
        assert r.status_code == 400, f"Expected 400 for >server limit, got {r.status_code}"

    def test_admin_voucher_pdf_requires_auth(self, api, admin_token):
        # First upload to obtain an id
        code = f"TEST{uuid.uuid4().hex[:6].upper()}"
        files = {"file": ("ok.pdf", _pdf_bytes(2), "application/pdf")}
        r = requests.post(f"{BASE_URL}/api/vouchers/upload", files=files, data={"code": code}, timeout=30)
        assert r.status_code == 200, r.text
        vid = r.json()["id"]

        # No auth -> 401
        r_no_auth = requests.get(f"{BASE_URL}/api/admin/vouchers/{vid}/pdf", timeout=15)
        assert r_no_auth.status_code == 401, f"Expected 401 without auth, got {r_no_auth.status_code}"

        # With admin token -> PDF
        r_ok = requests.get(
            f"{BASE_URL}/api/admin/vouchers/{vid}/pdf",
            headers=auth_headers(admin_token), timeout=30,
        )
        assert r_ok.status_code == 200, r_ok.text
        assert "application/pdf" in r_ok.headers.get("content-type", "")
        assert r_ok.content.startswith(b"%PDF")


# ============================ POSTCODE (Aveiro 37xx + 38xx) ============================
class TestPostcodeAveiroExpanded:
    def test_postcode_3800_aveiro(self, api):
        r = api.get(f"{BASE_URL}/api/postcode/check?code=3800")
        assert r.status_code == 200
        assert r.json()["hand_delivery_available"] is True

    def test_postcode_3700_oliveira_azemeis(self, api):
        r = api.get(f"{BASE_URL}/api/postcode/check?code=3700")
        assert r.status_code == 200
        assert r.json()["hand_delivery_available"] is True, (
            "3700 (Oliveira de Azeméis) should be within Aveiro hand-delivery zone"
        )

    def test_postcode_lisbon_blocked(self, api):
        r = api.get(f"{BASE_URL}/api/postcode/check?code=1000")
        assert r.status_code == 200
        assert r.json()["hand_delivery_available"] is False


class TestOrdersHandDelivery:
    def _first_book_isbn(self, api):
        data = api.get(f"{BASE_URL}/api/books?limit=50").json()
        # /api/books returns a paginated dict {items, total, ...} as of iteration 2.
        items = data["items"] if isinstance(data, dict) else data
        chosen = next((b for b in items if b.get("status") == "Available" and (b.get("stock_qty") or 0) > 0), None)
        assert chosen is not None, "No in-stock available books found for order tests"
        return chosen["isbn13"]

    def test_order_hand_delivery_3700_ok(self, api):
        isbn = self._first_book_isbn(api)
        payload = {
            "items": [{"isbn13": isbn, "qty": 1, "lamination": False}],
            "customer_name": "TEST OAZ",
            "customer_email": "test_oaz@example.com",
            "customer_phone": "910000001",
            "delivery_method": "hand_delivery",
            "delivery_concelho": "Oliveira de Azeméis",
            "address": "Rua de Teste 1",
            "postal_code": "3700",
            "terms_accepted": True,
        }
        r = api.post(f"{BASE_URL}/api/orders", json=payload)
        assert r.status_code == 200, r.text
        assert r.json()["order"]["order_no"].startswith("TS-")

    def test_order_hand_delivery_1000_blocked(self, api):
        isbn = self._first_book_isbn(api)
        payload = {
            "items": [{"isbn13": isbn, "qty": 1, "lamination": False}],
            "customer_name": "TEST LX",
            "customer_email": "test_lx@example.com",
            "customer_phone": "910000002",
            "delivery_method": "hand_delivery",
            "delivery_concelho": "Lisboa",
            "address": "Lisboa",
            "postal_code": "1000",
            "terms_accepted": True,
        }
        r = api.post(f"{BASE_URL}/api/orders", json=payload)
        assert r.status_code == 400


# ============================ ADMIN: enrich-covers + partners + auth-me ============================
class TestAdminMisc:
    def test_enrich_covers_runs(self, api, admin_token):
        h = auth_headers(admin_token)
        r = requests.post(
            f"{BASE_URL}/api/admin/books/enrich-covers?limit=5",
            headers=h, timeout=120,
        )
        assert r.status_code == 200, r.text
        d = r.json()
        assert "updated" in d, f"Response missing 'updated': {d}"
        assert isinstance(d["updated"], int)

    def test_partners_have_logo_and_promo(self, api):
        r = api.get(f"{BASE_URL}/api/partners")
        assert r.status_code == 200
        partners = r.json()
        assert len(partners) >= 3
        names = {p["name"] for p in partners}
        # Expected three sponsors
        for expected in ("Beira-Mar", "Vista Alegre", "Iliabum"):
            assert any(expected.lower() in n.lower() for n in names), (
                f"Missing partner matching '{expected}' in {names}"
            )
        for p in partners:
            assert p.get("logo_url"), f"Partner {p.get('name')} missing logo_url"
            assert p.get("promo_code"), f"Partner {p.get('name')} missing promo_code"

    def test_auth_me_admin(self, api, admin_token):
        r = api.get(f"{BASE_URL}/api/auth/me", headers=auth_headers(admin_token))
        assert r.status_code == 200
        u = r.json()
        assert u["email"] == ADMIN_EMAIL.lower()
        assert u["role"] == "admin"
        assert "password_hash" not in u
