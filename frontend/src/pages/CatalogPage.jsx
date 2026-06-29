import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "@/lib/api";
import { BookCard } from "@/components/BookCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import SEO from "@/components/SEO";
import { toast } from "sonner";
import { Search, Filter, X } from "lucide-react";

export default function CatalogPage() {
  const [params, setParams] = useSearchParams();
  const [books, setBooks] = useState([]);
  const [total, setTotal] = useState(0);
  const [subjects, setSubjects] = useState([]);
  const [grades, setGrades] = useState([]);
  const [munis, setMunis] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState(params.get("q") || "");
  const { add } = useCart();

  const subject = params.get("subject") || "all";
  const type = params.get("type") || "all";
  const grade = params.get("grade") || "";
  const mun = params.get("mun") || "";
  const schoolId = params.get("school_id") || "";

  const setParam = (k, v) => {
    const next = new URLSearchParams(params);
    if (v && v !== "all") next.set(k, v); else next.delete(k);
    if (k === "grade" || k === "mun") {
      next.delete("school_id");
    }
    if (k === "mun") {
      next.delete("school_id");
    }
    setParams(next);
  };

  const fetchBooks = async () => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (q) qs.set("q", q);
    if (subject !== "all") qs.set("subject", subject);
    if (type !== "all") qs.set("type", type);
    if (schoolId) qs.set("school_id", schoolId);
    if (grade) qs.set("grade_level", grade);
    qs.set("limit", "500");
    const { data } = await api.get(`/books?${qs.toString()}`);
    setBooks(data.items || []);
    setTotal(data.total ?? (data.items || []).length);
    setLoading(false);
  };

  useEffect(() => {
    api.get("/books/subjects").then((r) => setSubjects(r.data.filter(Boolean)));
    api.get("/grade-levels").then((r) => setGrades(r.data));
    api.get("/municipalities").then((r) => setMunis(r.data));
  }, []);

  useEffect(() => {
    if (mun) {
      const qs = new URLSearchParams({ municipality_id: mun });
      if (grade) qs.set("grade", grade);
      api.get(`/schools?${qs.toString()}`).then((r) => setSchools(Array.isArray(r.data) ? r.data : []));
    } else setSchools([]);
  }, [mun, grade]);

  useEffect(() => { fetchBooks(); /* eslint-disable-next-line */ }, [params]);

  const submitSearch = (e) => {
    e?.preventDefault();
    setParam("q", q);
  };

  const clearAll = () => { setQ(""); setParams(new URLSearchParams()); };
  const handleAdd = (book) => { add(book.isbn13); toast.success("Adicionado ao carrinho"); };
  const activeFilters = ["q", "subject", "type", "grade", "mun", "school_id"].filter((k) => params.get(k));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" data-testid="catalog-page">
      <SEO title="Catálogo de Manuais Escolares" path="/catalogo" description="Catálogo completo de manuais escolares e cadernos de fichas. Filtre por ano, concelho, escola, disciplina e tipo. Compra online com entrega em Aveiro."/>
      <div className="mb-10">
        <div className="text-[10px] tracking-[0.2em] uppercase text-[#4A5568] font-semibold mb-2">Catálogo</div>
        <h1 className="font-display text-4xl md:text-5xl font-medium text-[#1A202C] mb-3">
          {schoolId ? "Manuais da escola" : "Manuais Escolares"}
        </h1>
        {grade && <p className="text-[#4A5568]">Ano: <span className="font-medium text-[#1A202C]">{grade}</span></p>}
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#E2E8F0] rounded-md p-5 mb-8 space-y-3" data-testid="catalog-filters">
        <form onSubmit={submitSearch} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5568]" strokeWidth={1.5}/>
          <Input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Pesquisar por título, autor ou ISBN..." className="pl-10 h-11" data-testid="catalog-search-input"/>
        </form>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Select value={grade || "all"} onValueChange={(v) => setParam("grade", v === "all" ? "" : v)}>
            <SelectTrigger className="h-10" data-testid="filter-grade"><SelectValue placeholder="Ano"/></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Qualquer ano</SelectItem>
              {grades.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={mun || "all"} onValueChange={(v) => setParam("mun", v === "all" ? "" : v)}>
            <SelectTrigger className="h-10" data-testid="filter-municipality"><SelectValue placeholder="Concelho"/></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Qualquer concelho</SelectItem>
              {munis.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={schoolId || "all"} onValueChange={(v) => setParam("school_id", v === "all" ? "" : v)} disabled={!mun}>
            <SelectTrigger className="h-10" data-testid="filter-school"><SelectValue placeholder={mun ? "Escola" : "Escolha concelho"}/></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Qualquer escola</SelectItem>
              {schools.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={subject} onValueChange={(v) => setParam("subject", v)}>
            <SelectTrigger className="h-10" data-testid="filter-subject"><SelectValue placeholder="Disciplina"/></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Qualquer disciplina</SelectItem>
              {subjects.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={type} onValueChange={(v) => setParam("type", v)}>
            <SelectTrigger className="h-10" data-testid="filter-type"><SelectValue placeholder="Tipo"/></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Manuais e Cadernos</SelectItem>
              <SelectItem value="Manual">Apenas Manuais</SelectItem>
              <SelectItem value="Workbook">Apenas Cadernos</SelectItem>
            </SelectContent>
          </Select>

          {activeFilters.length > 0 && (
            <Button type="button" variant="outline" onClick={clearAll} className="h-10" data-testid="clear-filters-btn">
              <X className="w-3.5 h-3.5 mr-1.5"/> Limpar
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-[#4A5568]" data-testid="catalog-loading">A carregar...</div>
      ) : books.length === 0 ? (
        <div className="text-center py-20" data-testid="catalog-empty">
          <Filter className="w-10 h-10 text-[#4A5568] mx-auto mb-3" strokeWidth={1.5}/>
          <p className="text-[#4A5568] mb-3">Sem resultados para os filtros selecionados.</p>
          <Button variant="outline" onClick={clearAll}>Limpar filtros</Button>
        </div>
      ) : (
        <>
          <div className="text-sm text-[#4A5568] mb-4" data-testid="catalog-count">{books.length} de {total} resultado{total !== 1 ? "s" : ""}</div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5" data-testid="catalog-grid">
            {books.map((b) => <BookCard key={b.isbn13} book={b} onAdd={handleAdd}/>)}
          </div>
        </>
      )}
    </div>
  );
}
