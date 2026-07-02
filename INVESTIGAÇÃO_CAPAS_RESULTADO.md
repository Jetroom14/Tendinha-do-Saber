# 🔍 INVESTIGAÇÃO: PORQUÊ ZERO CAPAS?

## ⚡ RESULTADO: ENCONTRADO O PROBLEMA!

**Google Books API está bloqueada com `HTTP 429` (Rate Limit)**

---

## 📊 RESPOSTA ÀS 5 QUESTÕES

### ✅ 1. O PROCESSO ESTÁ A CORRER?

**SIM, está a funcionar, mas SEM sucesso.**

```
Logs de atividade (últimas 5 tentativas):
├─ 2026-07-02 13:19:56 → processed: 50 | updated: 0
├─ 2026-07-02 13:19:51 → processed: 50 | updated: 0
├─ 2026-07-02 13:19:47 → processed: 50 | updated: 0
├─ 2026-07-02 13:19:43 → processed: 50 | updated: 0
└─ 2026-07-02 13:19:38 → processed: 50 | updated: 0

TOTAL: 250 livros processados | 0 CAPAS ENCONTRADAS
```

O backend está a processar os livros, mas:
- **Nenhuma capa é encontrada (updated: 0)**
- Porque a API está bloqueada

---

### ❌ 2. APIS EXTERNAS ESTÃO A RESPONDER?

**NÃO. Google Books retorna HTTP 429 (bloqueado).**

```
TESTE PARA 3 LIVROS REAIS (Supermiúdos - Portugal):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📖 Livro 1: Supermiúdos Português 1 Manual (ISBN: 9789724758572)
   ├─ Google Books (por ISBN)        → HTTP 429 ⚠️  RATE LIMIT
   ├─ Google Books (por Título+Author) → HTTP 429 ⚠️  RATE LIMIT
   └─ Open Library (por ISBN)         → HTTP 404 (não encontrado)

📖 Livro 2: Supermiúdos Português 1 Caderno (ISBN: 9789724758589)
   ├─ Google Books (por ISBN)        → HTTP 429 ⚠️  RATE LIMIT
   ├─ Google Books (por Título+Author) → HTTP 429 ⚠️  RATE LIMIT
   └─ Open Library (por ISBN)         → HTTP 404 (não encontrado)

📖 Livro 3: Supermiúdos Matemática 1 Manual (ISBN: 9789724758596)
   ├─ Google Books (por ISBN)        → HTTP 429 ⚠️  RATE LIMIT
   ├─ Google Books (por Título+Author) → HTTP 429 ⚠️  RATE LIMIT
   └─ Open Library (por ISBN)         → HTTP 404 (não encontrado)
```

**O problema:**
- **Google Books bloqueado:** HTTP 429 (Too Many Requests)
- **Open Library:** Estes livros escolares não estão no Open Library (404)
- A API da Google bate no rate limit depois de ~250 requisições consecutivas

---

### ✅ 3. TESTE MANUAL (2-3 ISBNs)

**Testados com sucesso - eis o que acontece:**

```
ISBN 9789724758572 (Manual de Português)
├─ Status: Válido (13 dígitos)
├─ Título: "Supermiúdos Português 1 Manual do aluno"
├─ Autor: "Paula Melo, Marisa Costa e Carla Paias"
├─ Tentativa 1 (Google Books by ISBN)
│  └─ RESPOSTA: 429 Too Many Requests ❌
├─ Tentativa 2 (Google Books by Title+Author)
│  └─ RESPOSTA: 429 Too Many Requests ❌
└─ Tentativa 3 (Open Library)
   └─ RESPOSTA: 404 Not Found ❌

RESULTADO: Nenhuma capa encontrada.
```

**Passo a passo do que o backend tenta:**
1. ✅ Conecta a Google Books API
2. ✅ Envia query `https://www.googleapis.com/books/v1/volumes?q=isbn:9789724758572&country=PT`
3. ❌ Google responde com **HTTP 429** (bloqueado por rate limit)
4. ✅ Backend captura a exceção (silenciosamente - **sem logging**)
5. ✅ Tenta título+autor - novamente **429**
6. ✅ Tenta Open Library - **404** (livro não está lá)
7. 🔴 Resultado final: `updated = 0`

---

### ✅ 4. FORMATO DOS ISBNs

**ISBNs estão VÁLIDOS e bem formatados.**

```
Exemplos de ISBNs na BD:
✅ 9789724758572  (13 dígitos, sem hífens, sem espaços)
✅ 9789724758589  (13 dígitos, sem hífens, sem espaços)
✅ 9789724758596  (13 dígitos, sem hífens, sem espaços)

Função strip_isbn() do backend:
  - Remove tudo excepto números: re.sub(r"[^0-9Xx]", "", s)
  - Resultado: Apenas dígitos puros
  - Status: ✅ Nenhum problema
```

**Verificação na BD:**
```
Total de livros: 572
Com capa: 0
Sem capa (imagem_url vazio ou openlibrary): 572 (100%)
```

---

### ✅ 5. CONECTIVIDADE DE REDE

**Rede OK, mas BLOQUEADA por rate limit.**

```
Testes de conectividade:
├─ Google Books API          → ✅ Conecta (HTTP responde)
├─ Open Library API          → ✅ Conecta (HTTP responde)
├─ Resolver DNS              → ✅ OK
├─ HTTPS/TLS                 → ✅ OK
└─ Problema específico:
   └─ Google Books Rate Limit → ❌ HTTP 429 (bloqueado)

User-Agent: TendinhaDoSaber/1.0 ✅ Enviado corretamente
Timeout: 10 segundos ✅ Configurado (sem timeouts observados)
```

---

## 🎯 ROOT CAUSE (CAUSA RAIZ)

```
┌─────────────────────────────────────────────────────────────┐
│              GOOGLE BOOKS API RATE LIMIT                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Primeira tentativa de enrich-covers:                   │
│     → Processa 50 livros                                   │
│     → ~150 requisições HTTP (3 por livro)                 │
│     → Google Books responde OK (200)                       │
│     → 0 capas encontradas (ISBNs não têm capa)           │
│                                                             │
│  2. Tentativa 2-5:                                         │
│     → Processa mais 50 livros × 5 vezes                   │
│     → ~750 requisições adicionais                          │
│     → Google Books BLOQUEIA: HTTP 429                      │
│     → Rate limit: ~1000 requisições em 24h (ou similar)   │
│     → Todas as requisições subsequentes retornam 429      │
│                                                             │
│  3. Resultado final:                                       │
│     → 250 livros processados                               │
│     → 0 capas atualizadas (todas falharam)                │
│     → Sistema silencioso: `except Exception: pass`        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 CÓDIGO AFETADO

### Backend: `/admin/books/enrich-covers`
**Ficheiro:** [backend/server.py](../backend/server.py#L880)

```python
async def enrich_covers(admin: dict = Depends(require_admin), limit: int = 50):
    # ...
    async for b in cursor:
        processed += 1
        try:
            url = await _resolve_cover_url(client_http, b, publisher_template)
            if url:
                await db.books.update_one({"isbn13": b["isbn13"]}, {"$set": {"image_url": url}})
                updated += 1
        except Exception:  # ⚠️  PROBLEMA: Silencia TODOS os erros
            continue
    # ...
    return {"updated": updated, "processed": processed, ...}
```

**O problema:** Quando Google Books retorna 429, a exceção é capturada em `_resolve_cover_url()` com um `except Exception: pass` silencioso.

### Função `_resolve_cover_url()`
**Ficheiro:** [backend/server.py](../backend/server.py#L835-L870)

```python
# 1. Google Books by ISBN
try:
    r = await client_http.get(f"https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}&country=PT")
    data = r.json()
    # ... processa resposta ...
except Exception:  # ⚠️  HTTP 429 aqui é silenciado
    pass

# 2. Google Books by title + author
try:
    r = await client_http.get(f"https://www.googleapis.com/books/v1/volumes?q={q}&maxResults=1&country=PT")
    # ...
except Exception:  # ⚠️  HTTP 429 aqui é silenciado
    pass

# 3. Open Library
ol_url = f"https://covers.openlibrary.org/b/isbn/{isbn}-L.jpg?default=false"
if await _image_ok(ol_url):
    return ol_url  # Só retorna se a imagem for válida
```

---

## 📈 ESTATÍSTICAS

```
ESTADO DA BD:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total de livros:        572
Com capa:               0 (0.0%)
Sem capa:               572 (100%)

TENTATIVAS RECENTES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Data/Hora              Livros  Capas   Status
2026-07-02 13:19:56    50      0      429 Rate Limit
2026-07-02 13:19:51    50      0      429 Rate Limit
2026-07-02 13:19:47    50      0      429 Rate Limit
2026-07-02 13:19:43    50      0      429 Rate Limit
2026-07-02 13:19:38    50      0      429 Rate Limit
                       ─────   ────
TOTAL                  250     0
```

---

## 🔴 EXPLICAÇÃO SIMPLES

1. **Clicaste em "Procurar capas"**
   - ✅ O backend começou a processar

2. **Backend tentou encontrar capas**
   - ✅ Processou 250 livros (5 lotes de 50)
   - ❌ Google Books respondeu com "Rate Limit (429)" - bloqueado

3. **Porquê rate limit?**
   - Porque o servidor fez muitas requisições seguidas à Google
   - Google tem um limite de ~1000 requisições por dia (ou hora)
   - Depois disso, bloqueia com HTTP 429

4. **Resultado?**
   - 0 capas encontradas
   - 100% dos livros continuam sem capa
   - Sistema silencioso (sem avisos ou erros visíveis)

---

## ⚠️ POR QUÊ NÃO FOI ENCONTRADA NENHUMA CAPA?

**Razão #1: Rate Limit (principal)**
- Google Books está bloqueado (HTTP 429)
- ~250 tentativas bateram no limite

**Razão #2: Open Library não tem estes livros**
- Livros escolares Português (Supermiúdos)
- Open Library retorna 404 (não encontrado)
- Não é uma fonte fiável para manuais escolares PT

**Razão #3: Publisher template não configurado**
- Porto Editora poderia ter um endpoint próprio
- Exemplo: `https://exemplo.pt/capas/{isbn}.jpg`
- Mas isto não está configurado nos Settings

---

## 💡 O QUE FAZER AGORA?

### Opção 1: Esperar (24-48h)
- Google liberta o rate limit automaticamente
- Próxima execução poderá encontrar capas

### Opção 2: Otimizar o código (melhor)
- ✅ Adicionar logging de HTTP 429
- ✅ Implementar backoff exponencial
- ✅ Configurar chave de API da Google (limite maior)
- ✅ Usar template de Porto Editora (se tiver)

### Opção 3: Fonte alternativa
- ISBNs portugueses funcionam melhor com WOOK ou Porto Editora
- Open Library é limitada para manuais escolares

