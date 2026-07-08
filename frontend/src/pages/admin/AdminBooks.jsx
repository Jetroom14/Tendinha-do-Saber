import { useEffect, useState } from "react";
import api, { formatApiErrorDetail } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus, Search, Image, RefreshCw, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const BLANK = { isbn13: "", pe_code: "", slug: "", related_book_id: "", title: "", author: "", publisher: "", subject: "", year: 2025, price: 0, type: "Manual", status: "Available", stock_qty: 0, synopsis: "", image_url: "", is_lamination_eligible: true };

// Bloco A: retorna a chave a usar em URLs de admin (edit/delete). Para livros
// com ISBN, é o ISBN. Para livros sem ISBN, é o slug (ou pe_code como fallback).
const bookKey = (b) => b.isbn13 || b.slug || b.pe_code || b.id;

export default function AdminBooks() {
  const [books, setBooks] = useState([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [coverStatus, setCoverStatus] = useState(null);
  const [syncing, setSyncing] = useState(false);

  const fetchBooks = async () => {
    const { data } = await api.get(`/books?limit=200${q ? `&q=${encodeURIComponent(q)}` : ""}`);
    setBooks(data.items || []);
  };
  const fetchCoverStatus = async () => {
    try { const { data } = await api.get("/admin/books/covers-status"); setCoverStatus(data); } catch { /* ignore */ }
  };
  useEffect(() => { fetchBooks(); /* eslint-disable-next-line */ }, [q]);
  useEffect(() => { fetchCoverStatus(); }, []);

  // Runs cover enrichment in batches until the backend reports done. Each call
  // handles up to 50 books; we loop so a 291-book catalog completes in one click.
  const syncCovers = async () => {
    setSyncing(true);
    let safety = 0; // hard cap so a persistent failure can't loop forever
    try {
      let done = false;
      while (!done && safety < 40) {
        safety += 1;
        const { data } = await api.post("/admin/books/enrich-covers?limit=50");
        setCoverStatus((cs) => cs ? { ...cs, missing: data.remaining, with_cover: cs.total - data.remaining } : cs);
        done = data.done || data.processed === 0;
      }
      await fetchCoverStatus();
      await fetchBooks();
      toast.success("Procura de capas concluída.");
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail) || "Erro ao procurar capas");
    } finally { setSyncing(false); }
  };

  const openCreate = () => { setEditing(null); setForm(BLANK); setOpen(true); };
  const openEdit = (b) => { setEditing(bookKey(b)); setForm({ ...BLANK, ...b, pe_code: b.pe_code || "", slug: b.slug || "", related_book_id: b.related_book_id || "" }); setOpen(true); };

  const save = async () => {
    try {
      const payload = { ...form, price: parseFloat(form.price) || 0, stock_qty: parseInt(form.stock_qty) || 0, year: parseInt(form.year) || null };
      // Bloco A: garantir que campos vazios são enviados como null/vazio corretos
      payload.pe_code = (form.pe_code || "").trim() || null;
      payload.related_book_id = (form.related_book_id || "").trim() || null;
      payload.slug = (form.slug || "").trim() || null;
      if (editing) await api.put(`/admin/books/${encodeURIComponent(editing)}`, payload);
      else await api.post("/admin/books", payload);
      toast.success(editing ? "Livro atualizado" : "Livro criado");
      setOpen(false); fetchBooks();
    } catch (e) { toast.error(formatApiErrorDetail(e.response?.data?.detail)); }
  };

  const remove = async (b) => {
    if (!confirm("Eliminar este livro?")) return;
    await api.delete(`/admin/books/${encodeURIComponent(bookKey(b))}`);
    toast.success("Livro eliminado"); fetchBooks();
  };

  return (
    <div className="p-8" data-testid="admin-books">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-[10px] tracking-[0.2em] uppercase text-slate-500 font-semibold">Catálogo</div>
          <h1 className="font-display text-3xl font-medium text-slate-900">Livros</h1>
        </div>
        <Button onClick={openCreate} className="bg-[#5A8F1E] hover:bg-[#3E6E11] text-white" data-testid="add-book-btn"><Plus className="w-4 h-4 mr-2"/>Novo livro</Button>
      </div>

      {/* Cover sync panel */}
      <div className="bg-white border border-slate-200 rounded p-4 mb-4 flex flex-col sm:flex-row sm:items-center gap-4" data-testid="cover-sync-panel">
        <div className="w-10 h-10 rounded bg-[#F5F8EC] grid place-items-center shrink-0">
          <Image className="w-5 h-5 text-[#5A8F1E]" strokeWidth={1.5}/>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-display font-medium text-slate-900 text-sm">Capas dos livros</div>
          {coverStatus ? (
            coverStatus.missing > 0 ? (
              <p className="text-xs text-slate-600 mt-0.5">
                {coverStatus.with_cover} de {coverStatus.total} livros têm capa · <span className="text-amber-700 font-medium">{coverStatus.missing} sem capa</span>. Procuramos pelo ISBN na editora (se configurada em Definições), Google Books e Open Library.
              </p>
            ) : (
              <p className="text-xs text-emerald-700 mt-0.5 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5"/> Todos os {coverStatus.total} livros têm capa.</p>
            )
          ) : (
            <p className="text-xs text-slate-500 mt-0.5">A verificar estado das capas...</p>
          )}
        </div>
        <Button
          onClick={syncCovers}
          disabled={syncing || (coverStatus && coverStatus.missing === 0)}
          variant="outline"
          className="border-[#5A8F1E] text-[#5A8F1E] hover:bg-[#5A8F1E] hover:text-white shrink-0"
          data-testid="cover-sync-btn"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? "animate-spin" : ""}`}/>
          {syncing ? `A procurar... (${coverStatus?.missing ?? ""} restantes)` : "Procurar capas em falta"}
        </Button>
      </div>

      <div className="bg-white border border-slate-200 rounded p-4 mb-4 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400"/>
        <Input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Pesquisar por ISBN, título, autor..." className="border-0 focus-visible:ring-0 h-8" data-testid="admin-books-search"/>
      </div>

      <div className="bg-white border border-slate-200 rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-[10px] uppercase tracking-wider text-slate-500 bg-slate-50">
            <tr>
              <th className="text-left p-3">ISBN / Cód. PE</th>
              <th className="text-left p-3">Título</th>
              <th className="text-left p-3">Disciplina</th>
              <th className="text-left p-3">Tipo</th>
              <th className="text-right p-3">Preço</th>
              <th className="text-center p-3">Stock</th>
              <th className="text-left p-3">Estado</th>
              <th className="p-3 w-24"></th>
            </tr>
          </thead>
          <tbody>
            {books.map((b) => (
              <tr key={b.id || bookKey(b)} className="border-t border-slate-100 hover:bg-slate-50" data-testid={`book-row-${bookKey(b)}`}>
                <td className="p-3 font-mono text-xs">
                  {b.isbn13 ? b.isbn13 : (
                    <span className="inline-flex items-center gap-1">
                      <span className="text-slate-400">—</span>
                      {b.pe_code && <span className="text-[10px] uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 rounded px-1.5 py-0.5">PE {b.pe_code}</span>}
                    </span>
                  )}
                </td>
                <td className="p-3 max-w-md truncate">{b.title}</td>
                <td className="p-3 text-slate-600">{b.subject}</td>
                <td className="p-3"><Badge variant="outline" className="text-xs">{b.type === "Workbook" ? "Caderno" : "Manual"}</Badge></td>
                <td className="p-3 text-right font-mono">{b.price?.toFixed(2)}€</td>
                <td className="p-3 text-center">{b.stock_qty}</td>
                <td className="p-3 text-xs">
                  {b.status === "Available" && <span className="text-emerald-700">● Disponível</span>}
                  {b.status === "PreOrder" && <span className="text-amber-700">● Pré-Venda</span>}
                  {b.status === "Unavailable" && <span className="text-rose-700">● Indisponível</span>}
                </td>
                <td className="p-3 flex gap-1">
                  <button onClick={()=>openEdit(b)} className="p-1.5 rounded hover:bg-slate-200" data-testid={`edit-book-${bookKey(b)}`}><Pencil className="w-3.5 h-3.5"/></button>
                  <button onClick={()=>remove(b)} className="p-1.5 rounded hover:bg-rose-100 text-rose-700" data-testid={`delete-book-${bookKey(b)}`}><Trash2 className="w-3.5 h-3.5"/></button>
                </td>
              </tr>
            ))}
            {books.length === 0 && <tr><td colSpan={8} className="p-10 text-center text-slate-500">Sem resultados.</td></tr>}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Editar livro" : "Novo livro"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="col-span-2"><Label>Título *</Label><Input value={form.title} onChange={(e)=>setForm({...form, title: e.target.value})} data-testid="book-form-title"/></div>
            <div><Label>ISBN-13 <span className="text-slate-400 text-xs">(opcional se tiver Código PE)</span></Label><Input value={form.isbn13} onChange={(e)=>setForm({...form, isbn13: e.target.value})} disabled={!!editing} placeholder="13 dígitos" data-testid="book-form-isbn"/></div>
            <div><Label>Código PE <span className="text-slate-400 text-xs">(Porto Editora, se sem ISBN)</span></Label><Input value={form.pe_code} onChange={(e)=>setForm({...form, pe_code: e.target.value})} placeholder="ex: 05000072" data-testid="book-form-pe-code"/></div>
            <div className="col-span-2 -mt-1 text-[11px] text-slate-500">Um livro precisa de <strong>ISBN OU Código PE</strong>. O Código PE é interno e nunca aparece ao cliente.</div>
            <div><Label>Disciplina</Label><Input value={form.subject} onChange={(e)=>setForm({...form, subject: e.target.value})}/></div>
            <div><Label>Autor</Label><Input value={form.author} onChange={(e)=>setForm({...form, author: e.target.value})}/></div>
            <div><Label>Editora</Label><Input value={form.publisher} onChange={(e)=>setForm({...form, publisher: e.target.value})}/></div>
            <div><Label>Preço (€) *</Label><Input type="number" step="0.01" value={form.price} onChange={(e)=>setForm({...form, price: e.target.value})}/></div>
            <div><Label>Stock</Label><Input type="number" value={form.stock_qty} onChange={(e)=>setForm({...form, stock_qty: e.target.value})}/></div>
            <div><Label>Tipo</Label>
              <Select value={form.type} onValueChange={(v)=>setForm({...form, type: v})}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent><SelectItem value="Manual">Manual</SelectItem><SelectItem value="Workbook">Caderno de Fichas</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Estado</Label>
              <Select value={form.status} onValueChange={(v)=>setForm({...form, status: v})}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Available">Disponível</SelectItem>
                  <SelectItem value="PreOrder">Disponível por Encomenda</SelectItem>
                  <SelectItem value="Unavailable">Indisponível</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Slug URL <span className="text-slate-400 text-xs">(auto)</span></Label><Input value={form.slug} onChange={(e)=>setForm({...form, slug: e.target.value})} placeholder="ex: matematica-a-11-modulo-3" className="font-mono text-xs" data-testid="book-form-slug"/></div>
            <div><Label>Livro relacionado (ID) <span className="text-slate-400 text-xs">(caderno↔manual, opcional)</span></Label><Input value={form.related_book_id} onChange={(e)=>setForm({...form, related_book_id: e.target.value})} placeholder="ISBN, slug ou ID do livro relacionado" className="font-mono text-xs" data-testid="book-form-related"/></div>
            <div className="col-span-2"><Label>URL da imagem</Label><Input value={form.image_url} onChange={(e)=>setForm({...form, image_url: e.target.value})}/></div>
            <div className="col-span-2"><Label>Sinopse</Label><Textarea value={form.synopsis} onChange={(e)=>setForm({...form, synopsis: e.target.value})}/></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setOpen(false)}>Cancelar</Button>
            <Button onClick={save} className="bg-[#5A8F1E] hover:bg-[#3E6E11] text-white" data-testid="save-book-btn">Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
