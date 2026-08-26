import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Upload, Book, CheckCircle2, AlertTriangle, ExternalLink, GraduationCap } from "lucide-react";

/**
 * Bloco D — Adoções Escolares (Admin)
 * • Lista os anos letivos guardados
 * • Permite escolher qual o "ano letivo activo" (o que o site público mostra)
 * • Importa novo ano letivo a partir de Excel oficial DGE
 *   (a importação SUBSTITUI só o ano letivo indicado, os outros ficam intactos)
 */
export default function AdminAdoptions() {
  const [years, setYears] = useState([]);
  const [active, setActive] = useState(null);
  const [uploadYear, setUploadYear] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const load = async () => {
    try {
      const { data } = await api.get("/admin/adoptions/years");
      setYears(data.years || []);
      setActive(data.active);
    } catch { toast.error("Erro ao carregar anos letivos"); }
  };
  useEffect(() => { load(); }, []);

  const setActiveYear = async (year) => {
    try {
      await api.put("/admin/adoptions/active-year", { school_year: year });
      setActive(year);
      toast.success(`Ano lectivo activo: ${year || "nenhum"}`);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Erro ao alterar ano activo");
    }
  };

  const doUpload = async () => {
    if (!file || !uploadYear.match(/^\d{4}\/\d{4}$/)) {
      toast.error("Escolha o ficheiro e o ano lectivo no formato AAAA/AAAA");
      return;
    }
    setUploading(true);
    setLastResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("school_year", uploadYear);
      const { data } = await api.post("/admin/adoptions/import", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 5 * 60 * 1000,  // 5 min para ficheiros grandes
      });
      setLastResult(data);
      toast.success(`${data.total} adoções importadas (${data.matched} no catálogo)`);
      setFile(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Erro ao importar. Verifique o ficheiro.");
    } finally { setUploading(false); }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl" data-testid="admin-adoptions">
      <div className="mb-6">
        <div className="text-[10px] tracking-[0.2em] uppercase text-slate-500 font-semibold">Adoções DGE</div>
        <h1 className="font-display text-3xl font-medium text-slate-900 flex items-center gap-2">
          <GraduationCap className="w-7 h-7 text-[#5A8F1E]" strokeWidth={1.5}/>
          Adoções Escolares
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Manuais adotados por cada escola por ano letivo. O site público mostra apenas o <strong>ano ativo</strong> escolhido abaixo.
        </p>
      </div>

      {/* Lista de anos letivos guardados */}
      <div className="bg-white border border-slate-200 rounded p-5 mb-6">
        <h2 className="font-display text-lg font-medium text-slate-900 mb-3">Anos letivos guardados</h2>
        {years.length === 0 ? (
          <div className="text-sm text-slate-500">Ainda sem adoções importadas.</div>
        ) : (
          <div className="space-y-2">
            {years.map((y) => (
              <div key={y.year} className="flex items-center gap-3 p-3 border border-slate-100 rounded" data-testid={`adoption-year-${y.year}`}>
                <Book className="w-4 h-4 text-slate-400" strokeWidth={1.5}/>
                <div className="flex-1">
                  <div className="font-mono text-sm">{y.year}</div>
                  <div className="text-xs text-slate-500">{y.count.toLocaleString("pt-PT")} adoções</div>
                </div>
                {active === y.year ? (
                  <span className="text-xs uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-1 rounded">Ativo</span>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setActiveYear(y.year)} data-testid={`activate-${y.year}`}>Tornar ativo</Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Importar */}
      <div className="bg-white border border-slate-200 rounded p-5">
        <h2 className="font-display text-lg font-medium text-slate-900 mb-3">Importar Excel DGE</h2>
        <p className="text-xs text-slate-500 mb-4">
          O Excel deve ter as colunas <code>Concelho, Agrupamento, Código Escola, Escola, Ano, Disciplina, ISBN, Título, Editora</code>. Corridas repetidas com o mesmo ano <strong>substituem</strong> apenas esse ano; os outros anos guardados <strong>não são tocados</strong>.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs uppercase tracking-wider text-slate-500 mb-1.5 block">Ano lectivo *</Label>
            <Input value={uploadYear} onChange={(e) => setUploadYear(e.target.value)} placeholder="Ex: 2026/2027" data-testid="adoption-year-input"/>
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider text-slate-500 mb-1.5 block">Ficheiro Excel *</Label>
            <Input type="file" accept=".xlsx,.xls" onChange={(e) => setFile(e.target.files?.[0] || null)} data-testid="adoption-file-input"/>
          </div>
        </div>
        <Button
          onClick={doUpload}
          disabled={uploading || !file || !uploadYear.match(/^\d{4}\/\d{4}$/)}
          className="mt-4 bg-[#5A8F1E] hover:bg-[#3E6E11] text-white disabled:bg-slate-300"
          data-testid="adoption-upload-btn"
        >
          <Upload className="w-4 h-4 mr-2"/>{uploading ? "A importar..." : "Importar"}
        </Button>

        {/* Resumo da última importação */}
        {lastResult && (
          <div className="mt-6 border-t border-slate-100 pt-4" data-testid="adoption-result">
            <div className="grid grid-cols-3 gap-2 text-sm mb-3">
              <div className="bg-slate-50 border border-slate-200 rounded p-2">
                <div className="text-[10px] uppercase text-slate-500">Total</div>
                <div className="text-lg font-medium">{lastResult.total}</div>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded p-2">
                <div className="text-[10px] uppercase text-emerald-700">No catálogo</div>
                <div className="text-lg font-medium text-emerald-800 flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> {lastResult.matched}</div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded p-2">
                <div className="text-[10px] uppercase text-amber-700">Em falta</div>
                <div className="text-lg font-medium text-amber-800 flex items-center gap-1"><AlertTriangle className="w-4 h-4"/> {lastResult.missing_count}</div>
              </div>
            </div>
            {lastResult.missing_count > 0 && (
              <details className="text-xs">
                <summary className="cursor-pointer text-slate-600 hover:text-slate-900">Ver ISBN em falta (amostra de {lastResult.missing_sample.length})</summary>
                <div className="mt-2 border border-slate-200 rounded max-h-64 overflow-y-auto">
                  <table className="w-full">
                    <tbody>
                      {lastResult.missing_sample.map((m, i) => (
                        <tr key={i} className="border-b border-slate-100">
                          <td className="p-2 font-mono">{m.isbn13}</td>
                          <td className="p-2 text-slate-600">{m.title}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 text-xs text-slate-500 flex items-center gap-2">
        <ExternalLink className="w-3.5 h-3.5"/> Pesquisa pública em <a href="/#adopcoes" className="text-[#5A8F1E] hover:underline">página inicial</a>
      </div>
    </div>
  );
}
