# Tendinha do Saber V2.0 — PRD

## Original Problem Statement
Construir um ecossistema de e-commerce profissional (Web + Painel Admin) especializado em manuais escolares para o distrito de Aveiro, emulando a robustez de Wook.pt / Bertrand.pt, com foco em:
- Catálogo escolar (Manuais + Cadernos de Fichas) com pesquisa por ISBN/título/disciplina
- Seletor em cascata Ano → Concelho → Escola
- Serviço de plastificação opcional (+2€) por livro
- Códigos promocionais de parceiros (5% só em cadernos)
- Geofencing Aveiro (entrega em mão vs levantamento)
- Vouchers MEGA (submissão + workflow admin)
- Importação Excel do catálogo (UPSERT por ISBN)
- Painel admin com RBAC (Super Admin + Admin)
- Conformidade PT (GDPR, RAL, Livro de Reclamações)

## User Personas
- **Família compradora**: pai/mãe que procura a lista escolar do filho. Quer encontrar a escola e adicionar tudo rapidamente.
- **Cliente com Voucher MEGA**: submete o voucher e acompanha o estado.
- **F. Tendinha (Admin)**: gere catálogo, encomendas, vouchers, parceiros.
- **Jetro Manança (Super Admin)**: acesso total + gestão de utilizadores admin.

## Architecture
- **Backend**: FastAPI (single `server.py`) + MongoDB (motor async). Endpoints `/api/*`.
- **Frontend**: React 19 + React Router 7 + Shadcn/UI + Tailwind. Cliente Axios com Bearer JWT.
- **Auth**: JWT custom (24h) + bcrypt + brute force lockout (5 → 30min).
- **Seed**: 2 admins (super_admin + admin), 5 concelhos, 8 escolas, 291 livros reais do Excel Leya, 3 parceiros reais (Beira-Mar, Vista Alegre, Iliabum).

## What's Implemented (2026-02)
### Storefront (público)
- Homepage com seletor em cascata Ano → Concelho → Escola
- Catálogo completo com filtros (disciplina, tipo) e pesquisa (Q por título/autor/ISBN)
- Página de detalhe do livro (sinopse, ficha técnica, badges de estado, wishlist)
- Carrinho com plastificação por item, código promocional com validação server-side
- Checkout com geofencing Aveiro (códigos postais 3800-3880)
- Página de confirmação de encomenda
- Submissão de vouchers (código + PDF link)
- Página de parceiros, contactos, sobre, FAQ, "Como funciona o voucher", seguir encomenda (sem login), legal (privacidade, termos, RAL), 404 personalizada
- Cookie consent banner (RGPD)
- Auth de cliente (registar + login + favoritos)

### Painel Admin (protegido)
- Dashboard com KPIs (livros, escolas, encomendas, vouchers pendentes, anomalias) + atalhos
- CRUD de livros + importação Excel (UPSERT por ISBN com preservação de dados manuais)
- Gestão de concelhos e escolas + ligação livro↔escola↔ano
- Gestão de encomendas com workflow de estado
- Gestão de vouchers MEGA com workflow Pending→Validated→Used/Rejected
- Gestão de parceiros + códigos promocionais
- Definições (preço plastificação, prefixos postais Aveiro)
- Activity logs (audit trail)
- Utilizadores (super admin only)

### Integrações (MOCKED)
- **Ifthenpay** (MB Way/Multibanco): MOCKED — log em consola; estado da encomenda é gerido manualmente pelo admin
- **InvoiceXpress**: MOCKED — quando admin marca encomenda como "paid", log de fatura
- **Email** (vouchers, password reset): MOCKED — log em consola
- **OAuth social**: deferido

## Backlog
### P0
- Integrar Ifthenpay real (precisa de chaves)
- Integrar InvoiceXpress real (precisa de chaves)
- Sender email real (Resend ou SMTP)
### P1
- OAuth Google/Facebook para clientes
- QR scanner mobile para vouchers
- "Look Inside" nos livros
- API Google Books fallback automático para capas
- Backup automático diário
- Modo manutenção
- Pesquisa avançada com sugestões
### P2
- Avaliações/testemunhos
- Histórico de stock (snapshots)
- Sistema de produtos relacionados (recommendations)
- Exportação Excel (clientes, vouchers, encomendas)
- API CTT/DPD para envios fora de Aveiro
- API MEGA oficial (não existe publicamente; integração manual)
- SEO técnico (sitemap.xml, robots.txt dinâmicos, schema.org Book)
- Vetorizar logo (SVG) — neste momento usa JPEG do user

## Credentials
Ver `/app/memory/test_credentials.md`.

## Operational Notes
- Restart backend: `sudo supervisorctl restart backend`
- Reseed: dropar coleções `books, municipalities, schools, school_books, partners, settings` e reiniciar backend
- Excel original em `/app/backend/seed_catalog.xlsx`
- Capas de livros: Open Library via ISBN (`https://covers.openlibrary.org/b/isbn/{ISBN}-L.jpg`) com fallback para inicial do título
