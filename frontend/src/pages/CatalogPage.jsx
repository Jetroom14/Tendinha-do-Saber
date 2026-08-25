import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "@/lib/api";
import { getBookKey } from "@/lib/bookKey";
import { BookCard } from "@/components/BookCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import SEO from "@/components/SEO";
import { formatSchoolGrade } from "@/lib/utils";
import { toast } from "sonner";
import { Search, Filter, X, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 24;

export default function CatalogPage() {
  const [params, setParams] = useSearchParams();
  const [books, setBooks] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [subjects, setSubjects] = useState([]);
  const [grades, setGrades] = useState([]);
  const [munis, setMunis] = useState([]);
  const [schools, setSchools] = useState([]);
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(false);
  const urlQ = params.get("q") || "";
  const [q, setQ] = useState(urlQ);
  const { add } = useCart();

  const subject = params.get("subject") || "all";
  const type = params.get("type") || "all";
  const grade = params.get("grade") || "";
  const mun = params.get("mun") || "";
  const schoolId = params.get("school") || "";
  const page = Math.max(1, parseInt(params.get("page") || "1", 10));

  const selectedMunicipality = munis.find((m) => m.id === mun || m.name === mun) || null;
  const municipalityId = selectedMunicipality?.id || "";
  const municipalityName = selectedMunicipality?.name || mun;
  const selectedSchool = schools.find((s) => s.id === schoolId || s.name === schoolId) || null;
  const schoolName = selectedSchool?.name || "";

  const setParam = useCallback((k, v) => {
    const next = new URLSearchParams(params);
    if (v && v !== "all") next.set(k, v); else next.delete(k);
    if (k === "mun") {
      next.delete("school");
      next.delete("grade");
    }
    if (k === "school") next.delete("grade");
    // reset to page 1 whenever a filter changes (not when changing page)
    if (k !== "page") next.delete("page");
    setParams(next);
  }, [params, setParams]);

  const goToPage = (p) => {
    const next = new URLSearchParams(params);
    if (p > 1) next.set("page", String(p)); else next.delete("page");
    setParams(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (urlQ) qs.set("q", urlQ);
      if (subject !== "all") qs.set("subject", subject);
      if (type !== "all") qs.set("type", type);
      if (municipalityName) qs.set("concelho", municipalityName);
      if (schoolName) qs.set("school_name", schoolName);
      if (grade) qs.set("grade_level", grade);
      qs.set("limit", String(PAGE_SIZE));
      qs.set("page", String(page));

      const { data } = await api.get(`/books?${qs.toString()}`);
      setBooks(data.items || []);
      setTotal(data.total ?? 0);
      setPages(data.pages ?? 1);
    } catch {
      setBooks([]);
      setTotal(0);
      setPages(1);
      toast.error("Não foi possível carregar o catálogo.");
    } finally {
      setLoading(false);
    }
  }, [grade, municipalityName, page, schoolName, subject, type, urlQ]);

  useEffect(() => {
    setQ(urlQ);
  }, [urlQ]);

  useEffect(() => {
    api.get("/books/subjects").then((r) => setSubjects(r.data.filter(Boolean)));
    api.get("/municipalities").then((r) => setMunis(Array.isArray(r.data) ? r.data : []));
  }, []);

  useEffect(() => {
    if (municipalityId) {
      api.get(`/schools?municipality_id=${encodeURIComponent(municipalityId)}`)
        .then((r) => setSchools(Array.isArray(r.data) ? r.data : []))
        .catch(() => setSchools([]));
    } else setSchools([]);
  }, [municipalityId]);

  useEffect(() => {
    if (selectedSchool) setGrades(selectedSchool.grades_taught || []);
    else setGrades([]);
  }, [selectedSchool]);

  useEffect(() => {
    if (mun && selectedMunicipality && mun !== selectedMunicipality.id) {
      setParam("mun", selectedMunicipality.id);
    }
  }, [mun, selectedMunicipality, setParam]);

  useEffect(() => {
    if (schoolId && selectedSchool && schoolId !== selectedSchool.id) {
      setParam("school", selectedSchool.id);
    }
  }, [schoolId, selectedSchool, setParam]);

  useEffect(() => {
    if (!schoolId || !grade) {
      setAvailability(null);
      return;
    }
    api.get(`/adoptions/availability?school_id=${encodeURIComponent(schoolId)}&grade=${encodeURIComponent(grade)}`)
      .then((r) => setAvailability(r.data))
      .catch(() => setAvailability(null));
  }, [schoolId, grade]);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  const submitSearch = (e) => {
    e?.preventDefault();
    setParam("q", q);
  };

  const clearAll = () => { setQ(""); setParams(new URLSearchParams()); };
  const handleAdd = (book) => { add(book); toast.success("Adicionado ao carrinho"); };
  const activeFilters = ["q", "subject", "type", "grade", "mun", "school"].filter((k) => params.get(k));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" data-testid="catalog-page">
      <SEO title="Catálogo de Manuais Escolares" path="/catalogo" description="Catálogo completo de manuais escolares e cadernos de fichas. Filtre por ano, concelho, escola, disciplina e tipo. Compra online com entrega em Aveiro."/>
      <div className="mb-10">
        <div className="text-[10px] tracking-[0.2em] uppercase text-[#4A5568] font-semibold mb-2">Catálogo</div>
        <h1 className="font-display text-4xl md:text-5xl font-medium text-[#1A202C] mb-3">{schoolName ? "Manuais da escola" : "Manuais Escolares"}</h1>
        {grade && <p className="text-[#4A5568]">Ano: <span className="font-medium text-[#1A202C]">{formatSchoolGrade(grade)}</span></p>}
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#E2E8F0] rounded-md p-5 mb-8 space-y-3" data-testid="catalog-filters">
        <form onSubmit={submitSearch} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5568]" strokeWidth={1.5}/>
          <Input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Pesquisar por título, autor ou ISBN..." className="pl-10 h-11" data-testid="catalog-search-input"/>
        </form>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Select
            value={municipalityId ? municipalityId : "all"}
            onValueChange={(v) => setParam("mun", v === "all" ? "" : v)}
          >
            <SelectTrigger className="h-10" data-testid="filter-municipality">
              <SelectValue placeholder="Concelho"/>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Concelho</SelectItem>
              {munis.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select
            value={municipalityId ? ((selectedSchool?.id || schoolId) || "all") : ""}
            onValueChange={(v) => setParam("school", v === "all" ? "" : v)}
            disabled={!municipalityId}
          >
            <SelectTrigger className="h-10" data-testid="filter-school">
              <SelectValue placeholder="Escola"/>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Escola</SelectItem>
              {schools.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select
            value={selectedSchool ? (grade || "all") : ""}
            onValueChange={(v) => setParam("grade", v === "all" ? "" : v)}
            disabled={!selectedSchool}
          >
            <SelectTrigger className="h-10" data-testid="filter-grade">
              <SelectValue placeholder="Ano"/>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Ano</SelectItem>
              {grades.map((g) => <SelectItem key={g} value={g}>{formatSchoolGrade(g)}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={subject} onValueChange={(v) => setParam("subject", v)}>
            <SelectTrigger className="h-10" data-testid="filter-subject">
              <SelectValue placeholder="Disciplina"/>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Qualquer disciplina</SelectItem>
              {subjects.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={type} onValueChange={(v) => setParam("type", v)}>
            <SelectTrigger className="h-10" data-testid="filter-type">
              <SelectValue placeholder="Tipo"/>
            </SelectTrigger>
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
          {availability && !availability.has_adoptions ? (
            <>
              <p className="text-[#4A5568] mb-4">A lista oficial de manuais desta escola ainda nao esta disponivel.</p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link to="/catalogo">
                  <Button className="bg-[#5A8F1E] hover:bg-[#3E6E11] text-white">Ver catalogo completo</Button>
                </Link>
                <Link to="/contactos" className="text-[#5A8F1E] hover:underline">Falar com a equipa</Link>
              </div>
            </>
          ) : (
            <>
              <p className="text-[#4A5568] mb-3">Sem resultados para os filtros selecionados.</p>
              <Button variant="outline" onClick={clearAll}>Limpar filtros</Button>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="text-sm text-[#4A5568] mb-4 flex items-center justify-between" data-testid="catalog-count">
            <span>{total} resultado{total !== 1 ? "s" : ""}</span>
            {pages > 1 && <span className="text-xs">Página {page} de {pages}</span>}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5" data-testid="catalog-grid">
            {books.map((b) => <BookCard key={getBookKey(b)} book={b} onAdd={handleAdd}/>)}
          </div>

          {pages > 1 && (
            <nav className="mt-12 flex items-center justify-center gap-1 flex-wrap" aria-label="Paginação" data-testid="catalog-pagination">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
                className="h-9 px-3"
                data-testid="page-prev"
              >
                <ChevronLeft className="w-4 h-4 mr-1" strokeWidth={1.5}/> Anterior
              </Button>

              {buildPageList(page, pages).map((p, i) =>
                p === "…" ? (
                  <span key={`gap-${i}`} className="px-2 text-[#4A5568] text-sm">…</span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    onClick={() => goToPage(p)}
                    aria-current={p === page ? "page" : undefined}
                    className={`h-9 min-w-9 px-3 rounded-md text-sm transition-colors ${p === page ? "bg-[#5A8F1E] text-white font-medium" : "border border-[#E2E8F0] bg-white text-[#1A202C] hover:bg-[#F5F8EC]"}`}
                    data-testid={`page-${p}`}
                  >
                    {p}
                  </button>
                )
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => goToPage(page + 1)}
                disabled={page >= pages}
                className="h-9 px-3"
                data-testid="page-next"
              >
                Seguinte <ChevronRight className="w-4 h-4 ml-1" strokeWidth={1.5}/>
              </Button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}

// Build a compact pagination list (e.g. [1, "…", 4, 5, 6, "…", 15])
function buildPageList(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, total, current, current - 1, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((n) => set.add(n));
  if (current >= total - 2) [total - 1, total - 2, total - 3].forEach((n) => set.add(n));
  const sorted = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push("…");
    out.push(sorted[i]);
  }
  return out;
}
