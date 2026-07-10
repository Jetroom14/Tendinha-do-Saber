import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "@/lib/api";
import SEO from "@/components/SEO";

/**
 * Bloco D — Página legal pública.
 * Lê o conteúdo do backend (`GET /api/legal/{slug}`) e renderiza o HTML
 * (já sanitizado no servidor com bleach — ver server.py::_sanitize_legal_html).
 * Se ainda não tiver conteúdo, mostra "Conteúdo em preparação." em vez de dar erro.
 */
export default function LegalPage() {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    api.get(`/legal/${slug}`)
      .then((r) => setPage(r.data))
      .catch((e) => {
        if (e.response?.status === 404) setNotFound(true);
        else setPage({ title: "Legal", content_html: "" });
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-20 text-slate-500 text-center">A carregar…</div>;

  if (notFound || !page) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center" data-testid="legal-not-found">
        Página não encontrada.
      </div>
    );
  }

  const isEmpty = !(page.content_html || "").trim();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16" data-testid={`legal-${slug}`}>
      <SEO title={page.title} description={page.title} url={`/legal/${slug}`}/>
      <div className="text-[10px] tracking-[0.2em] uppercase text-[#4A5568] font-semibold mb-2">Legal</div>
      <h1 className="font-display text-3xl md:text-4xl font-medium mb-8">{page.title}</h1>
      {isEmpty ? (
        <p className="text-[#4A5568] italic" data-testid="legal-empty">Conteúdo em preparação.</p>
      ) : (
        <div
          className="legal-content prose max-w-none text-[#1A202C] leading-relaxed"
          data-testid="legal-content"
          dangerouslySetInnerHTML={{ __html: page.content_html }}
        />
      )}
      {page.updated_at && !isEmpty && (
        <div className="text-xs text-slate-400 mt-10 pt-4 border-t border-slate-200">
          Última atualização: {new Date(page.updated_at).toLocaleDateString("pt-PT")}
        </div>
      )}
    </div>
  );
}
