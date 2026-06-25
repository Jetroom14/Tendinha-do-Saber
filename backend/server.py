"""Tendinha do Saber - Backend API (FastAPI + MongoDB)."""
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import re
import uuid
import json
import logging
import secrets
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any, Annotated

import bcrypt
import jwt
import pandas as pd
from io import BytesIO
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, UploadFile, File, Form, Query
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict

# ---------- Setup ----------
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MIN = 60 * 24  # 24h
JWT_SECRET = os.environ["JWT_SECRET"]
LAMINATION_PRICE = float(os.environ.get("LAMINATION_PRICE", "2.00"))

app = FastAPI(title="Tendinha do Saber API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("tendinha")

# ---------- Helpers ----------
def now_utc() -> datetime:
    return datetime.now(timezone.utc)

def iso(dt: datetime) -> str:
    return dt.isoformat()

def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False

def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": now_utc() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MIN),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def strip_isbn(s: str) -> str:
    return re.sub(r"[^0-9Xx]", "", s or "")

def gen_id() -> str:
    return str(uuid.uuid4())

def clean_doc(d: Optional[dict]) -> Optional[dict]:
    if d is None:
        return None
    d.pop("_id", None)
    return d

# ---------- Auth dependency ----------
async def get_current_user(request: Request) -> dict:
    auth = request.headers.get("Authorization", "")
    token = None
    if auth.startswith("Bearer "):
        token = auth[7:]
    if not token:
        token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(401, "Não autenticado")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(401, "Token inválido")
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(401, "Utilizador não encontrado")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Sessão expirada")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Token inválido")

async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") not in ("admin", "super_admin"):
        raise HTTPException(403, "Acesso restrito a administradores")
    return user

async def require_super_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "super_admin":
        raise HTTPException(403, "Acesso restrito ao Super Administrador")
    return user

async def log_action(admin_id: str, action: str, entity: str, entity_id: Optional[str] = None, details: Optional[dict] = None):
    await db.activity_logs.insert_one({
        "id": gen_id(),
        "admin_id": admin_id,
        "action_type": action,
        "entity": entity,
        "entity_id": entity_id,
        "details": details or {},
        "timestamp": iso(now_utc()),
    })

# ---------- Pydantic models ----------
class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(min_length=2)

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class FirstLoginIn(BaseModel):
    token: str
    password: str = Field(min_length=8)

class ForgotIn(BaseModel):
    email: EmailStr

class ResetIn(BaseModel):
    token: str
    password: str = Field(min_length=6)

class BookIn(BaseModel):
    isbn13: str
    title: str
    author: Optional[str] = ""
    publisher: Optional[str] = ""
    year: Optional[int] = None
    subject: Optional[str] = ""
    price: float
    type: str = "Manual"  # Manual | Workbook
    status: str = "Available"  # Available | PreOrder | Unavailable
    stock_qty: int = 0
    synopsis: Optional[str] = ""
    features: Optional[Dict[str, Any]] = {}
    image_url: Optional[str] = ""
    is_lamination_eligible: bool = True

class MunicipalityIn(BaseModel):
    name: str

class SchoolIn(BaseModel):
    name: str
    municipality_id: str

class SchoolBookIn(BaseModel):
    school_id: str
    isbn13: str
    grade_level: str

class PartnerIn(BaseModel):
    name: str
    logo_url: Optional[str] = ""
    description: Optional[str] = ""
    promo_code: str
    discount_value: float = 5.0

class VoucherSubmitIn(BaseModel):
    code: Optional[str] = None
    pdf_url: Optional[str] = None
    notes: Optional[str] = None

class CartItem(BaseModel):
    isbn13: str
    qty: int = 1
    lamination: bool = False

class PromoValidateIn(BaseModel):
    items: List[CartItem]
    promo_code: Optional[str] = None

class OrderCreateIn(BaseModel):
    items: List[CartItem]
    promo_code: Optional[str] = None
    customer_name: str
    customer_email: EmailStr
    customer_phone: str
    delivery_method: str  # hand_delivery | store_pickup
    address: Optional[str] = ""
    postal_code: Optional[str] = ""
    notes: Optional[str] = ""

class SettingIn(BaseModel):
    lamination_price: Optional[float] = None
    aveiro_postcodes: Optional[List[str]] = None

class WishlistIn(BaseModel):
    isbn13: str

# ---------- Auth routes ----------
@api.post("/auth/register")
async def register(payload: RegisterIn):
    email = payload.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(400, "Já existe uma conta com este email")
    user = {
        "id": gen_id(),
        "email": email,
        "name": payload.name,
        "role": "customer",
        "password_hash": hash_password(payload.password),
        "created_at": iso(now_utc()),
    }
    await db.users.insert_one(user)
    token = create_access_token(user["id"], email, "customer")
    return {"token": token, "user": {k: v for k, v in user.items() if k not in ("password_hash", "_id")}}

@api.post("/auth/login")
async def login(payload: LoginIn, request: Request):
    email = payload.email.lower()
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"

    # Brute force check
    rec = await db.login_attempts.find_one({"identifier": identifier})
    if rec and rec.get("locked_until"):
        locked = datetime.fromisoformat(rec["locked_until"])
        if locked > now_utc():
            mins = int((locked - now_utc()).total_seconds() / 60) + 1
            raise HTTPException(429, f"Conta bloqueada. Tente novamente em {mins} minutos.")

    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        # increment attempts
        attempts = (rec.get("attempts", 0) if rec else 0) + 1
        update = {"identifier": identifier, "attempts": attempts, "last_at": iso(now_utc())}
        if attempts >= 5:
            update["locked_until"] = iso(now_utc() + timedelta(minutes=30))
            update["attempts"] = 0
        await db.login_attempts.update_one({"identifier": identifier}, {"$set": update}, upsert=True)
        raise HTTPException(401, "Credenciais inválidas")

    # If admin has pending first-login flow
    if user.get("must_change_password"):
        raise HTTPException(403, "Primeiro acesso: defina uma nova palavra-passe através do link recebido por email.")

    await db.login_attempts.delete_one({"identifier": identifier})
    token = create_access_token(user["id"], user["email"], user["role"])
    safe = {k: v for k, v in user.items() if k not in ("_id", "password_hash")}
    return {"token": token, "user": safe}

@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user

@api.post("/auth/forgot-password")
async def forgot(payload: ForgotIn):
    user = await db.users.find_one({"email": payload.email.lower()})
    # Always success to prevent enumeration
    if user:
        token = secrets.token_urlsafe(32)
        await db.password_reset_tokens.insert_one({
            "id": gen_id(),
            "token": token,
            "user_id": user["id"],
            "used": False,
            "expires_at": iso(now_utc() + timedelta(hours=1)),
        })
        # MOCKED EMAIL: log link
        logger.info(f"[MOCKED EMAIL] Password reset for {payload.email}: token={token}")
    return {"message": "Se o email existir, receberá instruções de recuperação."}

@api.post("/auth/reset-password")
async def reset(payload: ResetIn):
    rec = await db.password_reset_tokens.find_one({"token": payload.token, "used": False})
    if not rec or datetime.fromisoformat(rec["expires_at"]) < now_utc():
        raise HTTPException(400, "Token inválido ou expirado")
    await db.users.update_one(
        {"id": rec["user_id"]},
        {"$set": {"password_hash": hash_password(payload.password), "must_change_password": False}},
    )
    await db.password_reset_tokens.update_one({"id": rec["id"]}, {"$set": {"used": True}})
    return {"message": "Palavra-passe atualizada com sucesso"}

@api.post("/auth/first-login")
async def first_login(payload: FirstLoginIn):
    rec = await db.password_reset_tokens.find_one({"token": payload.token, "used": False})
    if not rec or datetime.fromisoformat(rec["expires_at"]) < now_utc():
        raise HTTPException(400, "Token inválido ou expirado")
    await db.users.update_one(
        {"id": rec["user_id"]},
        {"$set": {"password_hash": hash_password(payload.password), "must_change_password": False}},
    )
    await db.password_reset_tokens.update_one({"id": rec["id"]}, {"$set": {"used": True}})
    user = await db.users.find_one({"id": rec["user_id"]}, {"_id": 0, "password_hash": 0})
    token = create_access_token(user["id"], user["email"], user["role"])
    return {"token": token, "user": user}

# ---------- Books ----------
@api.get("/books")
async def list_books(
    q: Optional[str] = None,
    subject: Optional[str] = None,
    type: Optional[str] = None,
    status: Optional[str] = None,
    school_id: Optional[str] = None,
    grade_level: Optional[str] = None,
    limit: int = 60,
    skip: int = 0,
):
    filt: Dict[str, Any] = {}
    if q:
        q_clean = strip_isbn(q)
        regex = {"$regex": re.escape(q), "$options": "i"}
        ors = [{"title": regex}, {"author": regex}, {"subject": regex}, {"publisher": regex}]
        if q_clean:
            ors.append({"isbn13": q_clean})
        filt["$or"] = ors
    if subject:
        filt["subject"] = subject
    if type:
        filt["type"] = type
    if status:
        filt["status"] = status

    if school_id:
        sb_filter: Dict[str, Any] = {"school_id": school_id}
        if grade_level:
            sb_filter["grade_level"] = grade_level
        isbns = await db.school_books.distinct("isbn13", sb_filter)
        filt["isbn13"] = {"$in": isbns}

    cursor = db.books.find(filt, {"_id": 0}).skip(skip).limit(limit)
    return await cursor.to_list(length=limit)

@api.get("/books/subjects")
async def list_subjects():
    return await db.books.distinct("subject")

@api.get("/books/{isbn13}")
async def get_book(isbn13: str):
    book = await db.books.find_one({"isbn13": strip_isbn(isbn13)}, {"_id": 0})
    if not book:
        raise HTTPException(404, "Livro não encontrado")
    return book

@api.post("/admin/books")
async def create_book(payload: BookIn, admin: dict = Depends(require_admin)):
    payload.isbn13 = strip_isbn(payload.isbn13)
    if await db.books.find_one({"isbn13": payload.isbn13}):
        raise HTTPException(400, "ISBN já existe")
    doc = payload.model_dump()
    doc["id"] = gen_id()
    doc["created_at"] = iso(now_utc())
    await db.books.insert_one(doc)
    await log_action(admin["id"], "create", "book", doc["id"], {"isbn": doc["isbn13"]})
    doc.pop("_id", None)
    return doc

@api.put("/admin/books/{isbn13}")
async def update_book(isbn13: str, payload: BookIn, admin: dict = Depends(require_admin)):
    update = payload.model_dump()
    update["isbn13"] = strip_isbn(update["isbn13"])
    res = await db.books.update_one({"isbn13": strip_isbn(isbn13)}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(404, "Livro não encontrado")
    await log_action(admin["id"], "update", "book", isbn13)
    return {"ok": True}

@api.delete("/admin/books/{isbn13}")
async def delete_book(isbn13: str, admin: dict = Depends(require_admin)):
    res = await db.books.delete_one({"isbn13": strip_isbn(isbn13)})
    if res.deleted_count == 0:
        raise HTTPException(404, "Livro não encontrado")
    await log_action(admin["id"], "delete", "book", isbn13)
    return {"ok": True}

# ---------- Excel Import ----------
@api.post("/admin/books/import")
async def import_books(file: UploadFile = File(...), admin: dict = Depends(require_admin)):
    content = await file.read()
    try:
        df = pd.read_excel(BytesIO(content))
    except Exception as e:
        raise HTTPException(400, f"Falha ao ler ficheiro Excel: {e}")

    df.columns = [str(c).strip().lower() for c in df.columns]
    col_map = {
        "ciclo": "cycle", "ano": "grade_level", "disciplina": "subject",
        "editora": "publisher", "título": "title", "titulo": "title",
        "isbn": "isbn13", "artigo": "type", "pvp": "price", "autor": "author",
    }
    df.rename(columns={k: v for k, v in col_map.items() if k in df.columns}, inplace=True)

    created = updated = anomalies = 0
    issues = []
    for _, row in df.iterrows():
        isbn = strip_isbn(str(row.get("isbn13", "")))
        title = str(row.get("title", "")).strip()
        try:
            price = float(row.get("price", 0) or 0)
        except Exception:
            price = 0.0
        if len(isbn) != 13 or price <= 0:
            anomalies += 1
            issues.append({"isbn": isbn, "title": title, "issue": "ISBN inválido ou preço 0"})
            if len(isbn) != 13:
                continue
        item_type = "Workbook" if "caderno" in str(row.get("type", "")).lower() or "workbook" in str(row.get("type", "")).lower() else "Manual"
        existing = await db.books.find_one({"isbn13": isbn})
        if existing:
            await db.books.update_one(
                {"isbn13": isbn},
                {"$set": {
                    "price": price,
                    "type": item_type,
                    "title": title or existing.get("title", ""),
                    "publisher": str(row.get("publisher", existing.get("publisher", ""))),
                    "author": str(row.get("author", existing.get("author", ""))),
                    "subject": str(row.get("subject", existing.get("subject", ""))),
                    "updated_at": iso(now_utc()),
                }},
            )
            updated += 1
        else:
            doc = {
                "id": gen_id(),
                "isbn13": isbn,
                "title": title,
                "author": str(row.get("author", "")),
                "publisher": str(row.get("publisher", "")),
                "subject": str(row.get("subject", "")),
                "price": price,
                "type": item_type,
                "status": "Available" if price > 0 else "Unavailable",
                "stock_qty": 0,
                "synopsis": "",
                "features": {"cycle": str(row.get("cycle", "")), "grade": str(row.get("grade_level", ""))},
                "image_url": "",
                "is_lamination_eligible": True,
                "created_at": iso(now_utc()),
            }
            await db.books.insert_one(doc)
            created += 1
    await log_action(admin["id"], "import", "books", None, {"created": created, "updated": updated, "anomalies": anomalies})
    return {"created": created, "updated": updated, "anomalies": anomalies, "issues": issues[:50]}

# ---------- Municipalities / Schools ----------
@api.get("/municipalities")
async def list_municipalities():
    return await db.municipalities.find({}, {"_id": 0}).sort("name", 1).to_list(500)

@api.get("/schools")
async def list_schools(municipality_id: Optional[str] = None):
    filt = {"municipality_id": municipality_id} if municipality_id else {}
    return await db.schools.find(filt, {"_id": 0}).sort("name", 1).to_list(2000)

@api.get("/grade-levels")
async def list_grades():
    grades = ["1.º Ano", "2.º Ano", "3.º Ano", "4.º Ano", "5.º Ano", "6.º Ano",
              "7.º Ano", "8.º Ano", "9.º Ano", "10.º Ano", "11.º Ano", "12.º Ano"]
    return grades

@api.post("/admin/municipalities")
async def create_mun(payload: MunicipalityIn, admin: dict = Depends(require_admin)):
    doc = {"id": gen_id(), "name": payload.name}
    await db.municipalities.insert_one(doc)
    await log_action(admin["id"], "create", "municipality", doc["id"])
    doc.pop("_id", None)
    return doc

@api.delete("/admin/municipalities/{mid}")
async def delete_mun(mid: str, admin: dict = Depends(require_admin)):
    await db.municipalities.delete_one({"id": mid})
    await db.schools.delete_many({"municipality_id": mid})
    await log_action(admin["id"], "delete", "municipality", mid)
    return {"ok": True}

@api.post("/admin/schools")
async def create_school(payload: SchoolIn, admin: dict = Depends(require_admin)):
    doc = {"id": gen_id(), "name": payload.name, "municipality_id": payload.municipality_id}
    await db.schools.insert_one(doc)
    await log_action(admin["id"], "create", "school", doc["id"])
    doc.pop("_id", None)
    return doc

@api.delete("/admin/schools/{sid}")
async def delete_school(sid: str, admin: dict = Depends(require_admin)):
    await db.schools.delete_one({"id": sid})
    await db.school_books.delete_many({"school_id": sid})
    await log_action(admin["id"], "delete", "school", sid)
    return {"ok": True}

@api.post("/admin/school-books")
async def link_school_book(payload: SchoolBookIn, admin: dict = Depends(require_admin)):
    payload_isbn = strip_isbn(payload.isbn13)
    existing = await db.school_books.find_one({"school_id": payload.school_id, "isbn13": payload_isbn, "grade_level": payload.grade_level})
    if existing:
        return clean_doc(existing)
    doc = {"id": gen_id(), "school_id": payload.school_id, "isbn13": payload_isbn, "grade_level": payload.grade_level}
    await db.school_books.insert_one(doc)
    await log_action(admin["id"], "link", "school_book", doc["id"])
    doc.pop("_id", None)
    return doc

@api.delete("/admin/school-books/{link_id}")
async def unlink_school_book(link_id: str, admin: dict = Depends(require_admin)):
    await db.school_books.delete_one({"id": link_id})
    return {"ok": True}

# ---------- Partners ----------
@api.get("/partners")
async def list_partners():
    return await db.partners.find({}, {"_id": 0}).to_list(200)

@api.post("/admin/partners")
async def create_partner(payload: PartnerIn, admin: dict = Depends(require_admin)):
    doc = payload.model_dump()
    doc["id"] = gen_id()
    doc["promo_code"] = doc["promo_code"].upper()
    if await db.partners.find_one({"promo_code": doc["promo_code"]}):
        raise HTTPException(400, "Código promocional já existe")
    await db.partners.insert_one(doc)
    await log_action(admin["id"], "create", "partner", doc["id"])
    doc.pop("_id", None)
    return doc

@api.delete("/admin/partners/{pid}")
async def delete_partner(pid: str, admin: dict = Depends(require_admin)):
    await db.partners.delete_one({"id": pid})
    return {"ok": True}

# ---------- Cart / Promo ----------
async def _compute_cart(items: List[CartItem], promo_code: Optional[str]) -> dict:
    promo = None
    if promo_code:
        promo = await db.partners.find_one({"promo_code": promo_code.upper()}, {"_id": 0})

    settings = await db.settings.find_one({"id": "global"}, {"_id": 0}) or {}
    lam_price = float(settings.get("lamination_price", LAMINATION_PRICE))

    lines = []
    subtotal_manuals = 0.0
    subtotal_workbooks = 0.0
    discount_workbooks = 0.0
    lamination_total = 0.0

    for it in items:
        book = await db.books.find_one({"isbn13": strip_isbn(it.isbn13)}, {"_id": 0})
        if not book:
            continue
        line_price = float(book["price"]) * it.qty
        line_lam = lam_price * it.qty if (it.lamination and book.get("is_lamination_eligible", True)) else 0.0
        is_workbook = book.get("type") == "Workbook"
        line_discount = 0.0
        if promo and is_workbook:
            line_discount = line_price * (float(promo["discount_value"]) / 100.0)
        if is_workbook:
            subtotal_workbooks += line_price
            discount_workbooks += line_discount
        else:
            subtotal_manuals += line_price
        lamination_total += line_lam
        lines.append({
            "isbn13": book["isbn13"],
            "title": book["title"],
            "image_url": book.get("image_url", ""),
            "qty": it.qty,
            "unit_price": book["price"],
            "type": book.get("type", "Manual"),
            "lamination": bool(line_lam > 0),
            "lamination_total": round(line_lam, 2),
            "line_subtotal": round(line_price, 2),
            "line_discount": round(line_discount, 2),
            "line_total": round(line_price - line_discount + line_lam, 2),
        })

    total = subtotal_manuals + subtotal_workbooks - discount_workbooks + lamination_total
    return {
        "lines": lines,
        "subtotal_manuals": round(subtotal_manuals, 2),
        "subtotal_workbooks": round(subtotal_workbooks, 2),
        "discount_workbooks": round(discount_workbooks, 2),
        "lamination_total": round(lamination_total, 2),
        "total": round(total, 2),
        "promo": {"code": promo["promo_code"], "discount_value": promo["discount_value"], "partner": promo["name"]} if promo else None,
        "lamination_price": lam_price,
    }

@api.post("/cart/validate")
async def cart_validate(payload: PromoValidateIn):
    return await _compute_cart(payload.items, payload.promo_code)

# ---------- Postcodes (Aveiro geofencing) ----------
@api.get("/postcode/check")
async def check_postcode(code: str):
    code_clean = code.strip().split("-")[0][:4] if code else ""
    settings = await db.settings.find_one({"id": "global"}, {"_id": 0}) or {}
    aveiro = settings.get("aveiro_postcodes", ["3800", "3810", "3830", "3840", "3850", "3860", "3870", "3880"])
    return {"hand_delivery_available": code_clean in aveiro, "postcode": code_clean, "valid_zones": aveiro}

# ---------- Orders ----------
@api.post("/orders")
async def create_order(payload: OrderCreateIn):
    summary = await _compute_cart(payload.items, payload.promo_code)
    if not summary["lines"]:
        raise HTTPException(400, "Carrinho vazio ou livros indisponíveis")
    if payload.delivery_method == "hand_delivery":
        chk = await check_postcode(payload.postal_code)
        if not chk["hand_delivery_available"]:
            raise HTTPException(400, "Entrega em mão não disponível para este código postal")

    order_no = f"TS-{int(now_utc().timestamp())}"
    doc = {
        "id": gen_id(),
        "order_no": order_no,
        "items": summary["lines"],
        "totals": {
            "subtotal_manuals": summary["subtotal_manuals"],
            "subtotal_workbooks": summary["subtotal_workbooks"],
            "discount_workbooks": summary["discount_workbooks"],
            "lamination_total": summary["lamination_total"],
            "total": summary["total"],
        },
        "promo": summary.get("promo"),
        "customer": {
            "name": payload.customer_name,
            "email": payload.customer_email.lower(),
            "phone": payload.customer_phone,
        },
        "delivery": {
            "method": payload.delivery_method,
            "address": payload.address,
            "postal_code": payload.postal_code,
        },
        "notes": payload.notes,
        "status": "pending_payment",
        "payment_status": "pending",
        "payment_provider": "ifthenpay_mocked",
        "invoice_status": "not_issued",
        "created_at": iso(now_utc()),
    }
    await db.orders.insert_one(doc)
    doc.pop("_id", None)
    # MOCKED payment + invoice hook
    logger.info(f"[MOCKED IFTHENPAY] Order {order_no} created, total={summary['total']}€")
    return doc

@api.get("/orders/{order_no}")
async def get_order(order_no: str):
    o = await db.orders.find_one({"order_no": order_no}, {"_id": 0})
    if not o:
        raise HTTPException(404, "Encomenda não encontrada")
    return o

@api.get("/admin/orders")
async def admin_list_orders(admin: dict = Depends(require_admin), status: Optional[str] = None):
    filt = {"status": status} if status else {}
    return await db.orders.find(filt, {"_id": 0}).sort("created_at", -1).to_list(500)

@api.put("/admin/orders/{order_no}/status")
async def admin_update_order(order_no: str, status: str = Form(...), admin: dict = Depends(require_admin)):
    res = await db.orders.update_one({"order_no": order_no}, {"$set": {"status": status, "updated_at": iso(now_utc())}})
    if res.matched_count == 0:
        raise HTTPException(404, "Encomenda não encontrada")
    await log_action(admin["id"], "update_status", "order", order_no, {"status": status})
    if status == "paid":
        logger.info(f"[MOCKED INVOICEXPRESS] Fatura-Recibo gerada para {order_no}")
        await db.orders.update_one({"order_no": order_no}, {"$set": {"invoice_status": "issued", "payment_status": "paid"}})
    return {"ok": True}

# ---------- Vouchers ----------
@api.post("/vouchers")
async def submit_voucher(payload: VoucherSubmitIn):
    # public submission (anonymous)
    doc = {
        "id": gen_id(),
        "code": (payload.code or "").upper().strip() or None,
        "pdf_url": payload.pdf_url,
        "notes": payload.notes,
        "status": "Pending",
        "customer_id": None,
        "order_id": None,
        "created_at": iso(now_utc()),
    }
    await db.vouchers.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api.get("/admin/vouchers")
async def admin_vouchers(admin: dict = Depends(require_admin), status: Optional[str] = None):
    filt = {"status": status} if status else {}
    return await db.vouchers.find(filt, {"_id": 0}).sort("created_at", -1).to_list(500)

@api.put("/admin/vouchers/{vid}/status")
async def admin_update_voucher(vid: str, status: str = Form(...), admin: dict = Depends(require_admin)):
    if status not in ("Pending", "Validated", "Used", "Rejected"):
        raise HTTPException(400, "Estado inválido")
    await db.vouchers.update_one({"id": vid}, {"$set": {"status": status, "updated_at": iso(now_utc())}})
    await log_action(admin["id"], "update_status", "voucher", vid, {"status": status})
    voucher = await db.vouchers.find_one({"id": vid}, {"_id": 0})
    if voucher and voucher.get("customer_id"):
        cust = await db.users.find_one({"id": voucher["customer_id"]}, {"_id": 0})
        if cust:
            logger.info(f"[MOCKED EMAIL] Voucher {vid} -> {status} to {cust.get('email')}")
    return {"ok": True}

# ---------- Wishlist ----------
@api.get("/wishlist")
async def get_wishlist(user: dict = Depends(get_current_user)):
    items = await db.wishlist.find({"user_id": user["id"]}, {"_id": 0}).to_list(500)
    isbns = [i["isbn13"] for i in items]
    books = await db.books.find({"isbn13": {"$in": isbns}}, {"_id": 0}).to_list(500)
    return books

@api.post("/wishlist")
async def add_wishlist(payload: WishlistIn, user: dict = Depends(get_current_user)):
    isbn = strip_isbn(payload.isbn13)
    if not await db.wishlist.find_one({"user_id": user["id"], "isbn13": isbn}):
        await db.wishlist.insert_one({"id": gen_id(), "user_id": user["id"], "isbn13": isbn, "created_at": iso(now_utc())})
    return {"ok": True}

@api.delete("/wishlist/{isbn13}")
async def remove_wishlist(isbn13: str, user: dict = Depends(get_current_user)):
    await db.wishlist.delete_one({"user_id": user["id"], "isbn13": strip_isbn(isbn13)})
    return {"ok": True}

# ---------- Admin: users, settings, logs ----------
@api.get("/admin/dashboard")
async def admin_dashboard(admin: dict = Depends(require_admin)):
    total_books = await db.books.count_documents({})
    total_schools = await db.schools.count_documents({})
    total_orders = await db.orders.count_documents({})
    pending_vouchers = await db.vouchers.count_documents({"status": "Pending"})
    anomalies = await db.books.count_documents({"$or": [{"price": 0}, {"price": {"$lte": 0}}]})
    recent_orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).limit(5).to_list(5)
    return {
        "total_books": total_books,
        "total_schools": total_schools,
        "total_orders": total_orders,
        "pending_vouchers": pending_vouchers,
        "anomalies": anomalies,
        "recent_orders": recent_orders,
    }

@api.get("/admin/users")
async def admin_users(admin: dict = Depends(require_super_admin)):
    return await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)

@api.get("/admin/activity-logs")
async def admin_logs(admin: dict = Depends(require_admin), limit: int = 200):
    return await db.activity_logs.find({}, {"_id": 0}).sort("timestamp", -1).limit(limit).to_list(limit)

@api.get("/admin/settings")
async def get_settings(admin: dict = Depends(require_admin)):
    s = await db.settings.find_one({"id": "global"}, {"_id": 0}) or {
        "id": "global",
        "lamination_price": LAMINATION_PRICE,
        "aveiro_postcodes": ["3800", "3810", "3830", "3840", "3850", "3860", "3870", "3880"],
    }
    return s

@api.put("/admin/settings")
async def update_settings(payload: SettingIn, admin: dict = Depends(require_admin)):
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    await db.settings.update_one({"id": "global"}, {"$set": {**update, "id": "global"}}, upsert=True)
    await log_action(admin["id"], "update", "settings", "global", update)
    return await db.settings.find_one({"id": "global"}, {"_id": 0})

# ---------- Seeding ----------
async def ensure_indexes():
    await db.users.create_index("email", unique=True)
    await db.books.create_index("isbn13", unique=True)
    await db.school_books.create_index([("school_id", 1), ("isbn13", 1), ("grade_level", 1)])
    await db.login_attempts.create_index("identifier")
    await db.password_reset_tokens.create_index("expires_at")

async def seed_admins():
    admins = [
        {"email": os.environ["SUPER_ADMIN_EMAIL"], "password": os.environ["SUPER_ADMIN_PASSWORD"], "role": "super_admin", "name": "Jetro Manança"},
        {"email": os.environ["ADMIN_EMAIL"], "password": os.environ["ADMIN_PASSWORD"], "role": "admin", "name": "F. Tendinha"},
    ]
    for a in admins:
        existing = await db.users.find_one({"email": a["email"].lower()})
        if not existing:
            await db.users.insert_one({
                "id": gen_id(),
                "email": a["email"].lower(),
                "name": a["name"],
                "role": a["role"],
                "password_hash": hash_password(a["password"]),
                "must_change_password": False,
                "created_at": iso(now_utc()),
            })
            logger.info(f"Seeded {a['role']}: {a['email']}")
        elif not verify_password(a["password"], existing["password_hash"]):
            await db.users.update_one(
                {"email": a["email"].lower()},
                {"$set": {"password_hash": hash_password(a["password"]), "role": a["role"], "name": a["name"]}},
            )

def _grade_to_label(s: str) -> str:
    s = str(s or "").strip()
    digits = re.search(r"(\d+)", s)
    return f"{digits.group(1)}.º Ano" if digits else s

def _cover_url(isbn: str) -> str:
    return f"https://covers.openlibrary.org/b/isbn/{isbn}-L.jpg"

async def seed_demo_data():
    if await db.municipalities.count_documents({}) > 0:
        return
    # Municipalities (Aveiro region)
    muns_data = ["Aveiro", "Ílhavo", "Vagos", "Águeda", "Oliveira do Bairro"]
    mun_ids = {}
    for m in muns_data:
        mid = gen_id()
        await db.municipalities.insert_one({"id": mid, "name": m})
        mun_ids[m] = mid

    # Schools
    schools_data = [
        ("EB 2,3 João Afonso de Aveiro", "Aveiro"),
        ("Escola Secundária José Estêvão", "Aveiro"),
        ("Escola Secundária Homem Cristo", "Aveiro"),
        ("EB 2,3 Gafanha da Nazaré", "Ílhavo"),
        ("Escola Secundária Dr. João Carlos Celestino Gomes", "Ílhavo"),
        ("EB 2,3 de Vagos", "Vagos"),
        ("Escola Secundária Marques de Castilho", "Águeda"),
        ("EB 2,3 Acácio de Azevedo", "Oliveira do Bairro"),
    ]
    school_ids = {}
    for name, mun in schools_data:
        sid = gen_id()
        await db.schools.insert_one({"id": sid, "name": name, "municipality_id": mun_ids[mun]})
        school_ids[name] = sid

    # Import real catalog from seed Excel if present
    seed_xlsx = ROOT_DIR / "seed_catalog.xlsx"
    imported_isbn_grade = {}  # isbn -> grade label
    if seed_xlsx.exists():
        try:
            df = pd.read_excel(seed_xlsx)
            for _, row in df.iterrows():
                isbn = strip_isbn(str(row.get("ISBN", "")))
                if len(isbn) != 13:
                    continue
                try:
                    price = float(row.get("PVP") or 0)
                except Exception:
                    price = 0.0
                if price <= 0:
                    continue
                artigo = str(row.get("Artigo", "")).strip().lower()
                book_type = "Workbook" if "caderno" in artigo else "Manual"
                title = str(row.get("Título") or "").strip()
                subject = str(row.get("Disciplina") or "").strip()
                publisher = str(row.get("Editora") or "").strip()
                author = str(row.get("Autor(es)") or "").strip()
                grade = _grade_to_label(row.get("Ano"))
                cycle = str(row.get("Ciclo de Ensino") or "").strip()
                doc = {
                    "id": gen_id(),
                    "isbn13": isbn,
                    "title": title,
                    "author": author,
                    "publisher": publisher,
                    "subject": subject,
                    "year": 2025,
                    "price": round(price, 2),
                    "type": book_type,
                    "status": "Available",
                    "stock_qty": 15,
                    "synopsis": f"{title} — material escolar oficial para o {grade}, da editora {publisher}.",
                    "features": {"cycle": cycle, "grade": grade, "format": book_type},
                    "image_url": _cover_url(isbn),
                    "is_lamination_eligible": book_type == "Manual",
                    "created_at": iso(now_utc()),
                }
                try:
                    await db.books.insert_one(doc)
                    imported_isbn_grade[isbn] = grade
                except Exception:
                    pass
            logger.info(f"Imported {len(imported_isbn_grade)} books from seed_catalog.xlsx")
        except Exception as e:
            logger.warning(f"Could not import seed catalog: {e}")

    # Additional curated demo books (used only if Excel import is missing or small)
    books_seed = [] if imported_isbn_grade else [
        # Manuals
        {"isbn13": "9789897070945", "title": "Pasta Mágica 1 - Português", "author": "Angelina Rodrigues", "publisher": "Areal Editores", "year": 2024, "subject": "Português", "price": 24.50, "type": "Manual", "is_lamination_eligible": True, "synopsis": "Manual de Português do 1.º ano de escolaridade, alinhado com as aprendizagens essenciais.", "image_url": "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&q=80"},
        {"isbn13": "9789897078811", "title": "Alfa Matemática 1.º Ano", "author": "Eva Lima", "publisher": "Porto Editora", "year": 2024, "subject": "Matemática", "price": 26.90, "type": "Manual", "is_lamination_eligible": True, "synopsis": "Manual de Matemática, com foco em raciocínio e resolução de problemas.", "image_url": "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&q=80"},
        {"isbn13": "9789897078812", "title": "Estudo do Meio 1.º Ano", "author": "Ana Maria Pessoa", "publisher": "Porto Editora", "year": 2024, "subject": "Estudo do Meio", "price": 22.40, "type": "Manual", "is_lamination_eligible": True, "synopsis": "Descobrir o mundo através de atividades práticas.", "image_url": "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&q=80"},
        {"isbn13": "9789897078813", "title": "Diálogos 5 - Português", "author": "Helena Margarida Vaz", "publisher": "Porto Editora", "year": 2024, "subject": "Português", "price": 32.10, "type": "Manual", "is_lamination_eligible": True, "synopsis": "Manual de Português para o 5.º ano.", "image_url": "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&q=80"},
        {"isbn13": "9789897078814", "title": "MSI 5 - Matemática", "author": "Maria Augusta Ferreira Neves", "publisher": "Porto Editora", "year": 2024, "subject": "Matemática", "price": 32.10, "type": "Manual", "is_lamination_eligible": True, "synopsis": "Matemática Sob Investigação - 5.º ano.", "image_url": "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&q=80"},
        {"isbn13": "9789897078815", "title": "Português 9 - Mensagens", "author": "Lúcia Vidal Soares", "publisher": "Texto Editores", "year": 2024, "subject": "Português", "price": 34.80, "type": "Manual", "is_lamination_eligible": True, "synopsis": "Manual de Português para o 9.º ano.", "image_url": "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&q=80"},
        {"isbn13": "9789897078816", "title": "Novo Espaço 11 - Matemática A", "author": "Belmiro Costa", "publisher": "Porto Editora", "year": 2024, "subject": "Matemática A", "price": 38.50, "type": "Manual", "is_lamination_eligible": True, "synopsis": "Manual de Matemática A para o 11.º ano.", "image_url": "https://images.unsplash.com/photo-1518744386442-2d48ac47a7eb?w=400&q=80"},
        # Workbooks
        {"isbn13": "9789897078901", "title": "Caderno de Fichas Pasta Mágica 1", "author": "Angelina Rodrigues", "publisher": "Areal Editores", "year": 2024, "subject": "Português", "price": 12.30, "type": "Workbook", "is_lamination_eligible": False, "synopsis": "Caderno de fichas de Português 1.º ano.", "image_url": "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&q=80"},
        {"isbn13": "9789897078902", "title": "Caderno Alfa Matemática 1.º", "author": "Eva Lima", "publisher": "Porto Editora", "year": 2024, "subject": "Matemática", "price": 12.80, "type": "Workbook", "is_lamination_eligible": False, "synopsis": "Caderno de atividades de Matemática 1.º ano.", "image_url": "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&q=80"},
        {"isbn13": "9789897078903", "title": "Caderno Diálogos 5", "author": "Helena Vaz", "publisher": "Porto Editora", "year": 2024, "subject": "Português", "price": 14.20, "type": "Workbook", "is_lamination_eligible": False, "synopsis": "Caderno de atividades de Português 5.º ano.", "image_url": "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&q=80"},
        {"isbn13": "9789897078904", "title": "Caderno MSI 5", "author": "Maria Neves", "publisher": "Porto Editora", "year": 2024, "subject": "Matemática", "price": 14.50, "type": "Workbook", "is_lamination_eligible": False, "synopsis": "Caderno de fichas de Matemática 5.º ano.", "image_url": "https://images.unsplash.com/photo-1576094792933-2f29e7e5fe71?w=400&q=80"},
        {"isbn13": "9789897078905", "title": "Caderno Mensagens 9", "author": "Lúcia Soares", "publisher": "Texto Editores", "year": 2024, "subject": "Português", "price": 15.10, "type": "Workbook", "is_lamination_eligible": False, "synopsis": "Caderno de Português 9.º ano.", "image_url": "https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?w=400&q=80"},
        {"isbn13": "9789897078906", "title": "Caderno Novo Espaço 11", "author": "Belmiro Costa", "publisher": "Porto Editora", "year": 2024, "subject": "Matemática A", "price": 16.40, "type": "Workbook", "is_lamination_eligible": False, "synopsis": "Caderno de Matemática A 11.º ano.", "image_url": "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&q=80"},
        {"isbn13": "9789897078920", "title": "Inglês 5 - Step Up", "author": "Cristina Cunha", "publisher": "Porto Editora", "year": 2024, "subject": "Inglês", "price": 28.40, "type": "Manual", "is_lamination_eligible": True, "synopsis": "Manual de Inglês 5.º ano.", "image_url": "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=400&q=80", "status": "PreOrder", "stock_qty": 0},
        {"isbn13": "9789897078921", "title": "Físico-Química 8 - Eureka!", "author": "Filomena Caldeira", "publisher": "Asa Editores", "year": 2024, "subject": "Físico-Química", "price": 30.20, "type": "Manual", "is_lamination_eligible": True, "synopsis": "Manual de FQ 8.º ano.", "image_url": "https://images.unsplash.com/photo-1554475901-4538ddfbccc2?w=400&q=80", "status": "Unavailable", "stock_qty": 0},
    ]
    for b in books_seed:
        b.setdefault("status", "Available")
        b.setdefault("stock_qty", 25)
        b.setdefault("synopsis", "")
        b.setdefault("features", {"format": "Manual escolar", "pages": 192})
        b["id"] = gen_id()
        b["created_at"] = iso(now_utc())
        await db.books.insert_one(b)

    # Link books to schools: associate every imported book to every Aveiro school for its grade
    school_list = list(school_ids.values())
    for isbn, grade in imported_isbn_grade.items():
        for sid in school_list:
            await db.school_books.insert_one({
                "id": gen_id(), "school_id": sid, "isbn13": isbn, "grade_level": grade,
            })

    # Partners (real Aveiro partners)
    partners_data = [
        {"name": "Academia do Beira-Mar", "logo_url": "https://upload.wikimedia.org/wikipedia/en/8/8b/SC_Beira-Mar.png", "description": "Os atletas da Academia do Beira-Mar beneficiam de 5% de desconto nos cadernos de atividades.", "promo_code": "BEIRAMAR5", "discount_value": 5.0, "order": 1, "active": True},
        {"name": "Academia Vista Alegre", "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Vista_Alegre_logo.svg/200px-Vista_Alegre_logo.svg.png", "description": "Os atletas da Academia Vista Alegre beneficiam de 5% de desconto nos cadernos de atividades.", "promo_code": "VISTAALEGRE5", "discount_value": 5.0, "order": 2, "active": True},
        {"name": "Iliabum Clube", "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Iliabum_Clube.png/200px-Iliabum_Clube.png", "description": "Os atletas do Iliabum Clube beneficiam de 5% de desconto nos cadernos de atividades.", "promo_code": "ILIABUM5", "discount_value": 5.0, "order": 3, "active": True},
    ]
    for p in partners_data:
        p["id"] = gen_id()
        await db.partners.insert_one(p)

    # Settings
    await db.settings.insert_one({
        "id": "global",
        "lamination_price": LAMINATION_PRICE,
        "aveiro_postcodes": ["3800", "3810", "3830", "3840", "3850", "3860", "3870", "3880"],
    })
    logger.info("Demo data seeded")

@app.on_event("startup")
async def startup():
    await ensure_indexes()
    await seed_admins()
    await seed_demo_data()

@app.on_event("shutdown")
async def shutdown():
    client.close()

# ---------- Health ----------
@api.get("/")
async def root():
    return {"message": "Tendinha do Saber API", "version": "2.0"}

# ---------- Register router ----------
app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
