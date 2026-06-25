import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "@/lib/api";
import { BookCard } from "@/components/BookCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { Search, Filter } from "lucide-react";

export default function CatalogPage() {
  const [params, setParams] = useSearchParams();
  const [books, setBooks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState(params.get("q") || "");
  const [subject, setSubject] = useState(params.get("subject") || "all");
  const [type, setType] = useState(params.get("type") || "all");
  const { add } = useCart();

  const schoolId = params.get("school_id");
  const grade = params.get("grade");

  const fetchBooks = async () => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (q) qs.set("q", q);
    if (subject && subject !== "all") qs.set("subject", subject);
    if (type && type !== "all") qs.set("type", type);
    if (schoolId) qs.set("school_id", schoolId);
    if (grade) qs.set("grade_level", grade);
    qs.set("limit", "60");
    const { data } = await api.get(`/books?${qs.toString()}`);
    setBooks(data);
    setLoading(false);
  };

  useEffect(() => { api.get("/books/subjects").then((r) => setSubjects(r.data.filter(Boolean))); }, []);
  useEffect(() => { fetchBooks(); /* eslint-disable-next-line */ }, [params, subject, type]);

  const submitSearch = (e) => {
    e?.preventDefault();
    const next = new URLSearchParams(params);
    if (q) next.set("q", q); else next.delete("q");
    setParams(next);
  };

  const handleAdd = (book) => { add(book.isbn13); toast.success("Adicionado ao carrinho"); };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" data-testid="catalog-page">
      <div className="mb-10">
        <div className="text-[10px] tracking-[0.2em] uppercase text-[#4A5568] font-semibold mb-2">Catálogo</div>
        <h1 className="font-display text-4xl md:text-5xl font-medium text-[#1A202C] mb-3">
          {schoolId ? "Manuais da sua escola" : "Manuais Escolares"}
        </h1>
        {grade && <p className="text-[#4A5568]">Ano: <span className="font-medium text-[#1A202C]">{grade}</span></p>}
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#E2E8F0] rounded-md p-5 mb-8 grid grid-cols-1 md:grid-cols-12 gap-3" data-testid="catalog-filters">
        <form onSubmit={submitSearch} className="md:col-span-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5568]" strokeWidth={1.5}/>
          <Input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Pesquisar por título, autor ou ISBN..." className="pl-10 h-11" data-testid="catalog-search-input"/>
        </form>
        <Select value={subject} onValueChange={setSubject}>
          <SelectTrigger className="md:col-span-3 h-11" data-testid="catalog-subject-filter"><SelectValue placeholder="Disciplina"/></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as disciplinas</SelectItem>
            {subjects.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="md:col-span-3 h-11" data-testid="catalog-type-filter"><SelectValue placeholder="Tipo"/></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Manuais e Cadernos</SelectItem>
            <SelectItem value="Manual">Manuais</SelectItem>
            <SelectItem value="Workbook">Cadernos de Fichas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-20 text-[#4A5568]" data-testid="catalog-loading">A carregar...</div>
      ) : books.length === 0 ? (
        <div className="text-center py-20" data-testid="catalog-empty">
          <Filter className="w-10 h-10 text-[#4A5568] mx-auto mb-3" strokeWidth={1.5}/>
          <p className="text-[#4A5568]">Sem resultados para os filtros selecionados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5" data-testid="catalog-grid">
          {books.map((b) => <BookCard key={b.isbn13} book={b} onAdd={handleAdd}/>)}
        </div>
      )}
    </div>
  );
}
