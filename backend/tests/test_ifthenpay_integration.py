import copy
import sys
import unittest
from pathlib import Path
from types import SimpleNamespace

from fastapi import HTTPException

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import server


class FakeResult:
    def __init__(self, matched_count=0, modified_count=0):
        self.matched_count = matched_count
        self.modified_count = modified_count


class FakeCollection:
    def __init__(self, docs=None):
        self.docs = [copy.deepcopy(doc) for doc in (docs or [])]

    def _get(self, doc, key):
        cur = doc
        for part in key.split("."):
            if not isinstance(cur, dict) or part not in cur:
                return None
            cur = cur[part]
        return cur

    def _set(self, doc, key, value):
        cur = doc
        parts = key.split(".")
        for part in parts[:-1]:
            cur = cur.setdefault(part, {})
        cur[parts[-1]] = value

    def _match(self, doc, filt):
        for key, expected in (filt or {}).items():
            value = self._get(doc, key)
            if isinstance(expected, dict):
                if "$ne" in expected and value == expected["$ne"]:
                    return False
                if "$exists" in expected:
                    exists = value is not None
                    if bool(expected["$exists"]) != exists:
                        return False
                if "$gte" in expected and (value is None or value < expected["$gte"]):
                    return False
                if "$in" in expected and value not in expected["$in"]:
                    return False
                if "$type" in expected and expected["$type"] == "string" and not isinstance(value, str):
                    return False
                if "$gt" in expected and not (value is not None and value > expected["$gt"]):
                    return False
            elif value != expected:
                return False
        return True

    async def find_one(self, filt, projection=None):
        for doc in self.docs:
            if self._match(doc, filt):
                return copy.deepcopy(doc)
        return None

    async def update_one(self, filt, update, upsert=False):
        for doc in self.docs:
            if self._match(doc, filt):
                if "$set" in update:
                    for key, value in update["$set"].items():
                        self._set(doc, key, value)
                if "$inc" in update:
                    for key, value in update["$inc"].items():
                        current = self._get(doc, key) or 0
                        self._set(doc, key, current + value)
                return FakeResult(matched_count=1, modified_count=1)
        if upsert:
            doc = {}
            for key, value in filt.items():
                if not isinstance(value, dict):
                    self._set(doc, key, value)
            if "$set" in update:
                for key, value in update["$set"].items():
                    self._set(doc, key, value)
            self.docs.append(doc)
            return FakeResult(matched_count=1, modified_count=1)
        return FakeResult(matched_count=0, modified_count=0)

    async def create_index(self, *args, **kwargs):
        return None


class FakeHttpResponse:
    def __init__(self, status_code, payload):
        self.status_code = status_code
        self._payload = payload

    def json(self):
        return copy.deepcopy(self._payload)

    def raise_for_status(self):
        if self.status_code >= 400:
            raise RuntimeError("http error")


class FakeHttpClient:
    def __init__(self, response):
        self.response = response

    async def post(self, *args, **kwargs):
        return self.response

    async def get(self, *args, **kwargs):
        return self.response


class IfthenpayIntegrationTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.original_db = server.db
        self.original_log_action = server.log_action
        self.original_send_contract_confirmation = server._send_contract_confirmation_if_available
        self.original_find_book_by_key = server._find_book_by_key
        self.original_mb_callback = server.IFTHENPAY_MB_CALLBACK_KEY
        self.original_backoffice = server.IFTHENPAY_BACKOFFICE_KEY
        self.original_new_order_no = server._new_unique_order_no
        self.original_new_payment_order_id = server._new_unique_payment_order_id
        self.original_order_token = server._new_order_access_token
        self.original_order_token_hash = server._hash_order_access_token
        self.original_order_token_expiry = server._order_access_expires_at

    def tearDown(self):
        server.db = self.original_db
        server.log_action = self.original_log_action
        server._send_contract_confirmation_if_available = self.original_send_contract_confirmation
        server._find_book_by_key = self.original_find_book_by_key
        server.IFTHENPAY_MB_CALLBACK_KEY = self.original_mb_callback
        server.IFTHENPAY_BACKOFFICE_KEY = self.original_backoffice
        server._new_unique_order_no = self.original_new_order_no
        server._new_unique_payment_order_id = self.original_new_payment_order_id
        server._new_order_access_token = self.original_order_token
        server._hash_order_access_token = self.original_order_token_hash
        server._order_access_expires_at = self.original_order_token_expiry

    async def test_normalize_mbway_phone_formats(self):
        self.assertEqual(server._normalize_mbway_phone("912345678"), "351#912345678")
        self.assertEqual(server._normalize_mbway_phone("+351 912 345 678"), "351#912345678")
        self.assertEqual(server._normalize_mbway_phone("351912345678"), "351#912345678")
        self.assertEqual(server._normalize_mbway_phone("00351912345678"), "351#912345678")

    async def test_normalize_mbway_phone_invalid(self):
        with self.assertRaises(HTTPException):
            server._normalize_mbway_phone("212345678")

    async def test_ifthenpay_multibanco_success(self):
        client = FakeHttpClient(FakeHttpResponse(200, {
            "Status": "0",
            "Entity": "12345",
            "Reference": "123 456 789",
            "Amount": "10.99",
            "RequestId": "REQ-1",
            "ExpiryDate": "2026-08-25",
        }))
        result = await server._ifthenpay_create_multibanco(
            client,
            order_id="T123456789012",
            amount=server._money_decimal("10.99"),
            description="Teste",
            client_name="Cliente",
            client_email="cliente@example.com",
            client_phone="910000000",
        )
        self.assertEqual(result["entity"], "12345")
        self.assertEqual(result["reference"], "123 456 789")

    async def test_ifthenpay_multibanco_status_error(self):
        client = FakeHttpClient(FakeHttpResponse(200, {"Status": "9"}))
        with self.assertRaises(server.IfthenpayError):
            await server._ifthenpay_create_multibanco(
                client,
                order_id="T123456789012",
                amount=server._money_decimal("10.99"),
                description="Teste",
                client_name="Cliente",
                client_email="cliente@example.com",
                client_phone="910000000",
            )

    async def test_ifthenpay_multibanco_amount_mismatch(self):
        client = FakeHttpClient(FakeHttpResponse(200, {"Status": "0", "Entity": "12345", "Reference": "123", "Amount": "11.99"}))
        with self.assertRaises(server.IfthenpayError):
            await server._ifthenpay_create_multibanco(
                client,
                order_id="T123456789012",
                amount=server._money_decimal("10.99"),
                description="Teste",
                client_name="Cliente",
                client_email="cliente@example.com",
                client_phone="910000000",
            )

    async def test_ifthenpay_mbway_success(self):
        client = FakeHttpClient(FakeHttpResponse(200, {"Status": "000", "RequestId": "REQ-2", "Amount": "10.99"}))
        result = await server._ifthenpay_create_mbway(
            client,
            order_id="T123456789012",
            amount=server._money_decimal("10.99"),
            mobile_number="351#912345678",
            email="cliente@example.com",
            description="Teste",
        )
        self.assertEqual(result["request_id"], "REQ-2")

    async def test_ifthenpay_payshop_success(self):
        client = FakeHttpClient(FakeHttpResponse(200, {"Code": "0", "Reference": "9999999999999", "Amount": "10.99", "RequestId": "REQ-3"}))
        result = await server._ifthenpay_create_payshop(
            client,
            order_id="T123456789012",
            amount=server._money_decimal("10.99"),
            expiry_date="20260825",
        )
        self.assertEqual(result["reference"], "9999999999999")

    async def test_compute_cart_and_stock_with_pe_only(self):
        book = {
            "id": "book-pe-1",
            "isbn13": "",
            "pe_code": "PE123",
            "slug": "book-pe-1",
            "title": "Workbook PE",
            "price": 12.5,
            "type": "Workbook",
            "status": "Available",
            "stock_qty": 2,
            "is_lamination_eligible": True,
        }
        books = FakeCollection([book])
        server.db = SimpleNamespace(
            books=books,
            partners=FakeCollection([]),
            settings=FakeCollection([{"id": "global"}]),
        )

        async def fake_find_book_by_key(key):
            return copy.deepcopy(book) if key == "PE123" else None

        server._find_book_by_key = fake_find_book_by_key
        summary = await server._compute_cart([server.CartItem(isbn13="PE123", qty=1, lamination=False)], None)
        self.assertEqual(summary["lines"][0]["book_id"], "book-pe-1")
        reserved = await server._reserve_stock(summary["lines"])
        stored = await books.find_one({"id": "book-pe-1"})
        self.assertEqual(stored["stock_qty"], 1)
        await server._restore_stock(reserved)
        restored = await books.find_one({"id": "book-pe-1"})
        self.assertEqual(restored["stock_qty"], 2)

    async def test_restore_stock_legacy_isbn_fallback(self):
        books = FakeCollection([{"id": "legacy-1", "isbn13": "9781234567897", "stock_qty": 0}])
        server.db = SimpleNamespace(books=books)
        await server._restore_stock([{"isbn13": "9781234567897", "qty": 1}])
        restored = await books.find_one({"isbn13": "9781234567897"})
        self.assertEqual(restored["stock_qty"], 1)

    async def test_mark_order_paid_counts_promo_once(self):
        orders = FakeCollection([{
            "order_no": "TS-1",
            "status": "pending_payment",
            "payment_status": "pending",
            "invoice_status": "not_issued",
            "contract_status": "pending",
            "promo": {"code": "PROMO10"},
            "payment": {"provider": "ifthenpay", "method": "multibanco", "order_id": "TPAY1", "amount": "10.00", "status": "pending"},
            "totals": {"total": 10.0},
        }])
        partners = FakeCollection([{"promo_code": "PROMO10", "usage_count": 0}])
        server.db = SimpleNamespace(orders=orders, partners=partners)

        async def fake_email(_order):
            return "not_configured"

        async def fake_log(*args, **kwargs):
            return None

        server._send_contract_confirmation_if_available = fake_email
        server.log_action = fake_log

        order = await orders.find_one({"order_no": "TS-1"})
        first = await server._mark_order_paid(order, callback_received_at=server.iso(server.now_utc()), provider_payment_datetime="2026-08-22 10:00:00")
        self.assertEqual(first, "paid")
        order_after = await orders.find_one({"order_no": "TS-1"})
        self.assertEqual(order_after["payment_status"], "paid")
        self.assertEqual(order_after["invoice_status"], "pending_issue")
        self.assertEqual(order_after["contract_status"], "accepted")
        partner_after = await partners.find_one({"promo_code": "PROMO10"})
        self.assertEqual(partner_after["usage_count"], 1)
        second = await server._mark_order_paid(order_after, callback_received_at=server.iso(server.now_utc()), provider_payment_datetime="2026-08-22 10:00:00")
        self.assertEqual(second, "already_paid")
        partner_after_dup = await partners.find_one({"promo_code": "PROMO10"})
        self.assertEqual(partner_after_dup["usage_count"], 1)


    async def test_email_failure_does_not_undo_paid_order(self):
        orders = FakeCollection([{
            "order_no": "TS-EMAIL-FAIL",
            "status": "pending_payment",
            "payment_status": "pending",
            "invoice_status": "not_issued",
            "contract_status": "pending",
            "payment_provider": "ifthenpay",
            "payment": {
                "provider": "ifthenpay",
                "method": "multibanco",
                "order_id": "PAY-EMAIL-FAIL",
                "amount": "10.00",
                "status": "pending",
            },
            "totals": {"total": 10.0},
        }])

        partners = FakeCollection([])
        server.db = SimpleNamespace(
            orders=orders,
            partners=partners,
        )

        async def fake_email(_order):
            return "send_failed"

        async def fake_log(*args, **kwargs):
            return None

        server._send_contract_confirmation_if_available = fake_email
        server.log_action = fake_log

        order = await orders.find_one({
            "order_no": "TS-EMAIL-FAIL"
        })

        result = await server._mark_order_paid(
            order,
            callback_received_at=server.iso(server.now_utc()),
            provider_payment_datetime="2026-08-28 10:00:00",
        )

        self.assertEqual(result, "paid")

        after = await orders.find_one({
            "order_no": "TS-EMAIL-FAIL"
        })

        self.assertEqual(after["payment_status"], "paid")
        self.assertEqual(after["status"], "paid")
        self.assertEqual(
            after["confirmation_email_status"],
            "send_failed",
        )


    async def test_duplicate_paid_transition_sends_email_once(self):
        orders = FakeCollection([{
            "order_no": "TS-EMAIL-ONCE",
            "status": "pending_payment",
            "payment_status": "pending",
            "invoice_status": "not_issued",
            "contract_status": "pending",
            "payment_provider": "ifthenpay",
            "payment": {
                "provider": "ifthenpay",
                "method": "multibanco",
                "order_id": "PAY-EMAIL-ONCE",
                "amount": "10.00",
                "status": "pending",
            },
            "totals": {"total": 10.0},
        }])

        partners = FakeCollection([])
        server.db = SimpleNamespace(
            orders=orders,
            partners=partners,
        )

        calls = 0

        async def fake_email(_order):
            nonlocal calls
            calls += 1
            return "sent"

        async def fake_log(*args, **kwargs):
            return None

        server._send_contract_confirmation_if_available = fake_email
        server.log_action = fake_log

        order = await orders.find_one({
            "order_no": "TS-EMAIL-ONCE"
        })

        first = await server._mark_order_paid(
            order,
            callback_received_at=server.iso(server.now_utc()),
            provider_payment_datetime="2026-08-28 10:00:00",
        )

        paid_order = await orders.find_one({
            "order_no": "TS-EMAIL-ONCE"
        })

        second = await server._mark_order_paid(
            paid_order,
            callback_received_at=server.iso(server.now_utc()),
            provider_payment_datetime="2026-08-28 10:00:01",
        )

        self.assertEqual(first, "paid")
        self.assertEqual(second, "already_paid")
        self.assertEqual(calls, 1)


    async def test_callback_invalid_secret(self):
        server.IFTHENPAY_MB_CALLBACK_KEY = "expected-secret"
        with self.assertRaises(HTTPException) as ctx:
            await server.ifthenpay_multibanco_callback("wrong", "PAY1", "10.00")
        self.assertEqual(ctx.exception.status_code, 403)

    async def test_callback_amount_mismatch(self):
        order = {
            "order_no": "TS-2",
            "status": "pending_payment",
            "payment_status": "pending",
            "payment_provider": "ifthenpay",
            "totals": {"total": 10.00},
            "payment": {"provider": "ifthenpay", "method": "multibanco", "order_id": "PAY2", "amount": "10.00", "request_id": "REQ2", "entity": "12345", "reference": "123456789"},
        }
        server.IFTHENPAY_MB_CALLBACK_KEY = "expected-secret"
        server.db = SimpleNamespace(orders=FakeCollection([order]))
        with self.assertRaises(HTTPException) as ctx:
            await server.ifthenpay_multibanco_callback("expected-secret", "PAY2", "9.99", requestId="REQ2", entity="12345", reference="123456789")
        self.assertEqual(ctx.exception.status_code, 400)

    async def test_callback_reference_mismatch(self):
        order = {
            "order_no": "TS-3",
            "status": "pending_payment",
            "payment_status": "pending",
            "payment_provider": "ifthenpay",
            "totals": {"total": 10.00},
            "payment": {"provider": "ifthenpay", "method": "multibanco", "order_id": "PAY3", "amount": "10.00", "request_id": "REQ3", "entity": "12345", "reference": "123456789"},
        }
        server.IFTHENPAY_MB_CALLBACK_KEY = "expected-secret"
        server.db = SimpleNamespace(orders=FakeCollection([order]))
        with self.assertRaises(HTTPException) as ctx:
            await server.ifthenpay_multibanco_callback("expected-secret", "PAY3", "10.00", requestId="REQ3", entity="12345", reference="WRONG")
        self.assertEqual(ctx.exception.status_code, 400)

    async def test_callback_success_and_duplicate(self):
        order = {
            "order_no": "TS-4",
            "status": "pending_payment",
            "payment_status": "pending",
            "invoice_status": "not_issued",
            "contract_status": "pending",
            "payment_provider": "ifthenpay",
            "promo": {"code": "PROMO20"},
            "totals": {"total": 10.00},
            "payment": {"provider": "ifthenpay", "method": "multibanco", "order_id": "PAY4", "amount": "10.00", "status": "pending", "request_id": "REQ4", "entity": "12345", "reference": "123456789"},
        }
        orders = FakeCollection([order])
        partners = FakeCollection([{"promo_code": "PROMO20", "usage_count": 0}])
        server.IFTHENPAY_MB_CALLBACK_KEY = "expected-secret"
        server.db = SimpleNamespace(orders=orders, partners=partners)

        async def fake_email(_order):
            return "not_configured"

        async def fake_log(*args, **kwargs):
            return None

        server._send_contract_confirmation_if_available = fake_email
        server.log_action = fake_log

        res = await server.ifthenpay_multibanco_callback("expected-secret", "PAY4", "10.00", requestId="REQ4", entity="12345", reference="123456789")
        self.assertTrue(res["ok"])
        paid_order = await orders.find_one({"order_no": "TS-4"})
        self.assertEqual(paid_order["payment_status"], "paid")
        res_dup = await server.ifthenpay_multibanco_callback("expected-secret", "PAY4", "10.00", requestId="REQ4", entity="12345", reference="123456789")
        self.assertTrue(res_dup["ok"])
        partner_after = await partners.find_one({"promo_code": "PROMO20"})
        self.assertEqual(partner_after["usage_count"], 1)

    async def test_admin_manual_paid_blocked(self):
        orders = FakeCollection([{"order_no": "TS-5", "status": "pending_payment", "payment_provider": "ifthenpay", "payment_status": "pending"}])
        server.db = SimpleNamespace(orders=orders)
        with self.assertRaises(HTTPException) as ctx:
            await server.admin_update_order("TS-5", status="paid", admin={"id": "admin-1"})
        self.assertEqual(ctx.exception.status_code, 409)

    async def test_admin_cancel_after_callback_paid_is_blocked(self):
        """Race — callback venceu primeiro: cancel admin tem de dar 409 sem mutar."""
        orders = FakeCollection([{
            "order_no": "TS-CB1", "status": "paid",
            "payment_provider": "ifthenpay", "payment_status": "paid",
        }])
        server.db = SimpleNamespace(orders=orders)
        with self.assertRaises(HTTPException) as ctx:
            await server.admin_update_order("TS-CB1", status="cancelled", admin={"id": "admin-1"})
        self.assertEqual(ctx.exception.status_code, 409)
        after = await orders.find_one({"order_no": "TS-CB1"})
        self.assertEqual(after["status"], "paid")
        self.assertEqual(after["payment_status"], "paid")

    async def test_reconciliation_safe(self):
        order = {
            "order_no": "TS-6",
            "status": "pending_payment",
            "payment_status": "pending",
            "invoice_status": "not_issued",
            "contract_status": "pending",
            "payment_provider": "ifthenpay",
            "totals": {"total": 10.00},
            "payment": {"provider": "ifthenpay", "method": "multibanco", "order_id": "PAY6", "amount": "10.00", "status": "pending", "request_id": "REQ6", "entity": "12345", "reference": "123456789"},
        }
        orders = FakeCollection([order])
        partners = FakeCollection([])
        server.IFTHENPAY_BACKOFFICE_KEY = "bo-key"
        server.db = SimpleNamespace(orders=orders, partners=partners)

        async def fake_read(_order):
            return {"payments": [{"orderId": "PAY6", "requestId": "REQ6", "reference": "123456789", "amount": "10.00", "payment_datetime": "2026-08-22 12:00:00"}]}

        async def fake_email(_order):
            return "not_configured"

        async def fake_log(*args, **kwargs):
            return None

        server._ifthenpay_read_payments = fake_read
        server._send_contract_confirmation_if_available = fake_email
        server.log_action = fake_log
        result = await server.admin_reconcile_payment("TS-6", admin={"id": "manager-1"})
        self.assertTrue(result["ok"])
        reconciled = await orders.find_one({"order_no": "TS-6"})
        self.assertEqual(reconciled["payment_status"], "paid")


if __name__ == "__main__":
    unittest.main()