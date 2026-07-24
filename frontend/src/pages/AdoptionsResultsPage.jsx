import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import api from "@/lib/api";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import SEO from "@/components/SEO";
import { toast } from "sonner";
import { GraduationCap, ShoppingCart, AlertTriangle, ArrowLeft } from "lucide-react";

/**
 * Bloco D4 — Página pública de manuais adotados por escola/ano.
 * URL: /adopcoes?concelho=...&escola=...&ano=...
 * • Agrupa por disciplina
 * • Livros no catálogo → adicionar ao carrinho
 * • Livros fora do catálogo → "Sob consulta"
 * • Botão "Adicionar todos" (com checkboxes para desmarcar)
 */
export default function AdoptionsResultsPage() {
  const [params] = useSearchParams();
  const concelho = params.get("concelho") || "";
  const escola = params.get("escola") || "";
  const grade = params.get("ano") || "";

  const { add } = useCart();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState({});

  useEffect(() => {
    if (!concelho || !escola || !grade) { setLoading(false); return; }
    setLoading(true);
    api.get(`/adoptions/books?concelho=${encodeURIComponent(concelho)}&escola=${encodeURIComponent(escola)}&grade=${encodeURIComponent(grade)}`)
      .then((r) => {
        setData(r.data);
        // Por defeito: todos os disponíveis marcados
        const preSelected = {};
        (r.data.books || []).forEach((b) => { if (b.in_catalog) preSelected[b.isbn13] = true; });
        setSelected(preSelected);
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [concelho, escola, grade]);

  const grouped = (() => {
    if (!data?.books) return {};
    const g = {};
    for (const b of data.books) {
      const key = b.subject || "Outros";
      if (!g[key]) g[key] = [];
      g[key].push(b);
    }
    return g;
  })();

  const addOne = (b) => {
    add(b.isbn13, 1);
    toast.success(`${b.title.slice(0, 40)} adicionado`);
  };

  const addAllSelected = () => {
    let n = 0;
    (data?.books || []).forEach((b) => {
      if (b.in_catalog && selected[b.isbn13]) {
        add(b.isbn13, 1);
        n++;
      }
    });
    toast.success(`${n} manual(is) adicionado(s) ao carrinho`);
  };

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-20 text-center text-slate-500">A carregar…</div>;

  if (!concelho || !escola || !grade || !data) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center" data-testid="adoption-no-params">
        <p className="text-slate-600">Escolha uma escola na página inicial.</p>
        <Link to="/" className="inline-flex items-center gap-2 text-[#5A8F1E] hover:underline mt-4"><ArrowLeft className="w-4 h-4"/> Voltar</Link>
      </div>
    );
  }

  const availableCount = (data.books || []).filter((b) => b.in_catalog).length;
  const missingCount = (data.books || []).filter((b) => !b.in_catalog).length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10" data-testid="adoption-results">
      <SEO title={`Manuais ${escola} — ${grade}`} description={`Manuais adotados por ${escola} para ${grade}`}/>
      <Link to="/" className="text-xs text-slate-500 hover:text-[#5A8F1E] inline-flex items-center gap-1 mb-4"><ArrowLeft className="w-3 h-3"/> Voltar à pesquisa</Link>
      <div className="border border-[#E2E8F0] rounded-md bg-[#F5F8EC] p-5 mb-8">
        <div className="flex items-start gap-3">
          <GraduationCap className="w-6 h-6 text-[#5A8F1E] mt-1" strokeWidth={1.5}/>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[#4A5568] font-semibold">Ano lectivo {data.school_year}</div>
            <h1 className="font-display text-2xl md:text-3xl font-medium text-[#1A202C]">{escola}</h1>
            <div className="text-sm text-[#4A5568] mt-0.5">{concelho} · {grade}</div>
          </div>
        </div>
      </div>

      {availableCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="text-sm text-[#4A5568]">
            {availableCount} manual{availableCount === 1 ? "" : "s"} disponível{availableCount === 1 ? "" : "eis"} · {missingCount} sob consulta
          </div>
          <Button onClick={addAllSelected} className="bg-[#5A8F1E] hover:bg-[#3E6E11] text-white" data-testid="add-all-btn">
            <ShoppingCart className="w-4 h-4 mr-2"/>Adicionar todos ({Object.values(selected).filter(Boolean).length})
          </Button>
        </div>
      )}

      {Object.keys(grouped).length === 0 && (
        <div className="text-center py-12 text-slate-500">Sem adoções registadas para esta escolha.</div>
      )}

      {Object.entries(grouped).map(([subject, books]) => (
        <section key={subject} className="mb-8" data-testid={`subject-${subject}`}>
          <h2 className="text-xs uppercase tracking-wider text-[#4A5568] font-semibold mb-3 border-b border-slate-200 pb-1.5">{subject}</h2>
          <div className="space-y-2">
            {books.map((b) => (
              <div key={b.isbn13} className={`flex items-center gap-3 p-3 border rounded-md ${b.in_catalog ? "bg-white border-slate-200" : "bg-slate-50 border-slate-100"}`} data-testid={`adoption-book-${b.isbn13}`}>
                {b.in_catalog && (
                  <Checkbox
                    checked={!!selected[b.isbn13]}
                    onCheckedChange={(v) => setSelected((s) => ({ ...s, [b.isbn13]: !!v }))}
                    data-testid={`sel-${b.isbn13}`}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className={`text-sm ${b.in_catalog ? "text-[#1A202C]" : "text-slate-500"}`}>{b.title}</div>
                  <div className="text-xs text-slate-500">{b.publisher}</div>
                </div>
                {b.in_catalog ? (
                  <>
                    <div className="text-sm font-mono text-[#1A202C]">{(b.price || 0).toFixed(2)}€</div>
                    <Button variant="outline" size="sm" onClick={() => addOne(b)} className="border-[#5A8F1E] text-[#5A8F1E] hover:bg-[#5A8F1E] hover:text-white" data-testid={`add-adoption-${b.isbn13}`}>
                      Adicionar
                    </Button>
                  </>
                ) : (
                  <span className="text-xs text-slate-500 italic" data-testid={`sob-consulta-${b.isbn13}`}>Sob consulta — contacte-nos</span>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}

      <div className="mt-10 pt-6 border-t border-slate-200 text-xs text-slate-500 flex items-start gap-2">
        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 text-amber-500 shrink-0"/>
        <span>Lista com base na informação oficial de adoções (DGE) para o ano lectivo {data.school_year}. Em caso de dúvida, confirme com a escola.</span>
      </div>
    </div>
  );
}
