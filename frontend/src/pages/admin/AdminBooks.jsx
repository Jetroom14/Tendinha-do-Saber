import { useEffect, useState } from "react";
import api, { formatApiErrorDetail } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus, Search } from "lucide-react";
import { toast } from "sonner";

const BLANK = { isbn13: "", title: "", author: "", publisher: "", subject: "", year: 2025, price: 0, type: "Manual", status: "Available", stock_qty: 0, synopsis: "", image_url: "", is_lamination_eligible: true };

export default function AdminBooks() {
  const [books, setBooks] = useState([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);

  const fetchBooks = async () => {
    const { data } = await api.get(`/books?limit=200${q ? `&q=${encodeURIComponent(q)}` : ""}`);
    setBooks(data);
  };
  useEffect(() => { fetchBooks(); /* eslint-disable-next-line */ }, [q]);

  const openCreate = () => { setEditing(null); setForm(BLANK); setOpen(true); };
  const openEdit = (b) => { setEditing(b.isbn13); setForm({ ...BLANK, ...b }); setOpen(true); };

  const save = async () => {
    try {
      const payload = { ...form, price: parseFloat(form.price) || 0, stock_qty: parseInt(form.stock_qty) || 0, year: parseInt(form.year) || null };
      if (editing) await api.put(`/admin/books/${editing}`, payload);
      else await api.post("/admin/books", payload);
      toast.success(editing ? "Livro atualizado" : "Livro criado");
      setOpen(false); fetchBooks();
    } catch (e) { toast.error(formatApiErrorDetail(e.response?.data?.detail)); }
  };

  const remove = async (isbn) => {
    if (!confirm("Eliminar este livro?")) return;
    await api.delete(`/admin/books/${isbn}`);
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

      <div className="bg-white border border-slate-200 rounded p-4 mb-4 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400"/>
        <Input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Pesquisar por ISBN, título, autor..." className="border-0 focus-visible:ring-0 h-8" data-testid="admin-books-search"/>
      </div>

      <div className="bg-white border border-slate-200 rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-[10px] uppercase tracking-wider text-slate-500 bg-slate-50">
            <tr>
              <th className="text-left p-3">ISBN</th>
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
              <tr key={b.isbn13} className="border-t border-slate-100 hover:bg-slate-50" data-testid={`book-row-${b.isbn13}`}>
                <td className="p-3 font-mono text-xs">{b.isbn13}</td>
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
                  <button onClick={()=>openEdit(b)} className="p-1.5 rounded hover:bg-slate-200" data-testid={`edit-book-${b.isbn13}`}><Pencil className="w-3.5 h-3.5"/></button>
                  <button onClick={()=>remove(b.isbn13)} className="p-1.5 rounded hover:bg-rose-100 text-rose-700" data-testid={`delete-book-${b.isbn13}`}><Trash2 className="w-3.5 h-3.5"/></button>
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
            <div><Label>ISBN-13 *</Label><Input value={form.isbn13} onChange={(e)=>setForm({...form, isbn13: e.target.value})} disabled={!!editing} data-testid="book-form-isbn"/></div>
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
