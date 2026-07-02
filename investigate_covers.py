#!/usr/bin/env python3
"""
Investigação de porquê zero capas encontradas.
Testa:
1. Conexão à BD + ISBNs reais
2. Chamadas às APIs Google Books e Open Library
3. Validação de URLs de capa
"""

import os
import sys
import asyncio
import httpx
import json
import re
from pathlib import Path
from dotenv import load_dotenv

# Load environment
ROOT_DIR = Path(__file__).parent / "backend"
load_dotenv(ROOT_DIR / ".env")

from motor.motor_asyncio import AsyncIOMotorClient

mongo_url = os.environ.get("MONGO_URL")
db_name = os.environ.get("DB_NAME")

if not mongo_url or not db_name:
    print("❌ MONGO_URL ou DB_NAME não definidos no .env")
    sys.exit(1)

def strip_isbn(s: str) -> str:
    """Remove tudo excepto números (igual ao backend)."""
    return re.sub(r"[^0-9Xx]", "", s or "")

async def main():
    print("=" * 80)
    print("INVESTIGAÇÃO: Porquê zero capas?")
    print("=" * 80)
    
    # Connect to MongoDB
    print("\n📊 Conectando à BD...")
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    try:
        await db.command("ping")
        print("✅ BD conectada")
    except Exception as e:
        print(f"❌ Erro ao conectar BD: {e}")
        return
    
    # Get some books
    print("\n📚 Buscando ISBNs de livros da BD...")
    books = await db.books.find(
        {"$or": [{"image_url": ""}, {"image_url": None}, {"image_url": {"$regex": "openlibrary"}}]},
        {"isbn13": 1, "title": 1, "author": 1, "image_url": 1}
    ).limit(10).to_list(None)
    
    if not books:
        print("⚠️  Nenhum livro sem capa encontrado (ou BD vazia)")
        return
    
    print(f"✅ Encontrados {len(books)} livros sem capa")
    print("\nPrimeiros 3 ISBNs:")
    for i, book in enumerate(books[:3], 1):
        isbn = book.get("isbn13", "N/A")
        title = book.get("title", "N/A")[:50]
        current_url = book.get("image_url", "(vazio)")
        print(f"   {i}. ISBN: {isbn} | Título: {title} | URL atual: {current_url[:40] if current_url else '(vazio)'}")
    
    # Test API calls
    print("\n" + "=" * 80)
    print("TESTANDO CHAMADAS ÀS APIS")
    print("=" * 80)
    
    async with httpx.AsyncClient(timeout=15.0, headers={"User-Agent": "TendinhaDoSaber/1.0"}) as client_http:
        for i, book in enumerate(books[:3], 1):
            isbn = book.get("isbn13", "")
            title = book.get("title", "")
            author = book.get("author", "")
            
            print(f"\n📖 Livro {i}: {title[:50]}")
            print(f"   ISBN: {isbn} | Author: {author[:40]}")
            
            if not isbn or len(isbn) < 10:
                print(f"   ❌ ISBN inválido: '{isbn}'")
                continue
            
            # Test Google Books by ISBN
            print(f"\n   1️⃣  Google Books (ISBN)...")
            try:
                url = f"https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}&country=PT"
                r = await client_http.get(url)
                print(f"      Status: {r.status_code}")
                
                if r.status_code == 200:
                    data = r.json()
                    total = data.get("totalItems", 0)
                    print(f"      Resultados: {total}")
                    
                    if total > 0:
                        links = data["items"][0].get("volumeInfo", {}).get("imageLinks", {})
                        img_url = links.get("thumbnail") or links.get("smallThumbnail")
                        if img_url:
                            print(f"      ✅ Encontrada imagem: {img_url[:60]}...")
                        else:
                            print(f"      ⚠️  Livro encontrado mas sem imageLinks")
                    else:
                        print(f"      ⚠️  Sem resultados para este ISBN")
                elif r.status_code == 429:
                    print(f"      ⚠️  RATE LIMIT (429) - API bloqueada!")
                elif r.status_code == 403:
                    print(f"      ⚠️  FORBIDDEN (403) - Acesso negado!")
                elif r.status_code >= 500:
                    print(f"      ⚠️  ERRO SERVIDOR ({r.status_code})")
                else:
                    print(f"      ⚠️  Erro HTTP: {r.status_code}")
                    
            except asyncio.TimeoutError:
                print(f"      ⚠️  TIMEOUT - API não responde (15s)")
            except Exception as e:
                print(f"      ❌ Exceção: {type(e).__name__}: {e}")
            
            # Test Google Books by title + author
            if title:
                print(f"\n   2️⃣  Google Books (Title+Author)...")
                try:
                    q = f'intitle:"{title}"'
                    if author:
                        q += f'+inauthor:"{author}"'
                    
                    url = f"https://www.googleapis.com/books/v1/volumes?q={q}&maxResults=1&country=PT"
                    r = await client_http.get(url)
                    print(f"      Status: {r.status_code}")
                    
                    if r.status_code == 200:
                        data = r.json()
                        total = data.get("totalItems", 0)
                        print(f"      Resultados: {total}")
                        
                        if total > 0:
                            links = data["items"][0].get("volumeInfo", {}).get("imageLinks", {})
                            img_url = links.get("thumbnail") or links.get("smallThumbnail")
                            if img_url:
                                print(f"      ✅ Encontrada imagem: {img_url[:60]}...")
                            else:
                                print(f"      ⚠️  Livro encontrado mas sem imageLinks")
                        else:
                            print(f"      ⚠️  Sem resultados para título/autor")
                    else:
                        print(f"      ⚠️  Status: {r.status_code}")
                        
                except asyncio.TimeoutError:
                    print(f"      ⚠️  TIMEOUT")
                except Exception as e:
                    print(f"      ❌ Exceção: {type(e).__name__}: {e}")
            
            # Test Open Library by ISBN
            print(f"\n   3️⃣  Open Library (ISBN)...")
            try:
                url = f"https://covers.openlibrary.org/b/isbn/{isbn}-L.jpg?default=false"
                r = await client_http.get(url, follow_redirects=True)
                print(f"      Status: {r.status_code}")
                
                if r.status_code == 200:
                    ctype = r.headers.get("content-type", "")
                    size = len(r.content)
                    print(f"      Content-Type: {ctype}")
                    print(f"      Tamanho: {size} bytes")
                    
                    if ctype.startswith("image") and size > 1500:
                        print(f"      ✅ Imagem válida encontrada!")
                    else:
                        print(f"      ⚠️  Resposta válida mas não é uma imagem real (placeholder?)")
                elif r.status_code == 404:
                    print(f"      ⚠️  Não encontrado (404)")
                else:
                    print(f"      ⚠️  Status: {r.status_code}")
                    
            except asyncio.TimeoutError:
                print(f"      ⚠️  TIMEOUT")
            except Exception as e:
                print(f"      ❌ Exceção: {type(e).__name__}: {e}")
    
    # Check activity logs for errors
    print("\n" + "=" * 80)
    print("VERIFICANDO LOGS DE ATIVIDADE")
    print("=" * 80)
    
    logs = await db.activity_logs.find(
        {"action_type": "enrich", "entity": "covers"}
    ).sort("timestamp", -1).limit(5).to_list(None)
    
    if logs:
        print(f"\n✅ Encontrados {len(logs)} registos de tentativas de enrich de capas")
        for i, log in enumerate(logs, 1):
            print(f"\n   Log {i}:")
            print(f"   - Admin: {log.get('admin_id')}")
            print(f"   - Data: {log.get('timestamp')}")
            print(f"   - Detalhes: {json.dumps(log.get('details', {}), indent=6)}")
    else:
        print("\n⚠️  Nenhum registo de tentativas de enrich de capas")
    
    # Check total stats
    print("\n" + "=" * 80)
    print("ESTATÍSTICAS GERAIS")
    print("=" * 80)
    
    total = await db.books.count_documents({})
    missing = await db.books.count_documents(
        {"$or": [{"image_url": ""}, {"image_url": None}, {"image_url": {"$regex": "openlibrary"}}]}
    )
    with_cover = total - missing
    
    print(f"\nTotal de livros: {total}")
    print(f"Com capa: {with_cover}")
    print(f"Sem capa (ou com openlibrary): {missing}")
    print(f"% com capa: {(with_cover/total*100):.1f}% " if total > 0 else "N/A")
    
    print("\n✅ Investigação concluída")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
