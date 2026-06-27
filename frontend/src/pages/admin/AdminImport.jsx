import { useState } from "react";
import api, { formatApiErrorDetail } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, ArrowRight, RotateCcw, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const ACTION_STYLE = {
  new: "text-emerald-700 bg-emerald-50",
  update: "text-blue-700 bg-blue-50",
  error: "text-rose-700 bg-rose-50",
};
const ACTION_LABEL = { new: "Novo", update: "Atualizar", error: "Erro" };

export default function AdminImport() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);   // phase 1 result
  const [committed, setCommitted] = useState(null); // phase 2 result

  const reset = () => { setFile(null); setPreview(null); setCommitted(null); };

  const runPreview = async () => {
    if (!file) { toast.error("Selecione um ficheiro Excel"); return; }
    setLoading(true); setCommitted(null);
    try {
      const fd = new FormData(); fd.append("file", file);
      const { data } = await api.post("/admin/books/import/preview", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setPreview(data);
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail) || "Erro ao analisar o ficheiro");
    } finally { setLoading(false); }
  };

  const confirmImport = async () => {
    if (!preview?.commit_token) return;
    setLoading(true);
    try {
      const { data } = await api.post("/admin/books/import/commit", { commit_token: preview.commit_token });
      setCommitted(data);
      setPreview(null);
      toast.success(`Importação concluída: ${data.created} novos · ${data.updated} atualizados`);
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail) || "Erro ao confirmar a importação");
    } finally { setLoading(false); }
  };

  return (
    <div className="p-8 max-w-4xl" data-testid="admin-import">
      <div className="mb-8">
        <div className="text-[10px] tracking-[0.2em] uppercase text-slate-500 font-semibold">Catálogo</div>
        <h1 className="font-display text-3xl font-medium text-slate-900">Importações</h1>
        <p className="text-sm text-slate-600 mt-2">Importe o catálogo a partir de Excel. O sistema mostra um resumo (novos / a atualizar / com erro) <strong>antes</strong> de gravar — nada é alterado sem a sua confirmação. ISBNs existentes são atualizados (preço, tipo), preservando sinopse e imagem editadas manualmente.</p>
      </div>

      {/* STEP 1 — file picker (hidden once we have a preview or result) */}
      {!preview && !committed && (
        <>
          <div className="bg-white border-2 border-dashed border-slate-300 rounded p-12 text-center mb-6">
            <FileSpreadsheet className="w-12 h-12 text-slate-400 mx-auto mb-4" strokeWidth={1.5}/>
            <label className="cursor-pointer">
              <input type="file" accept=".xlsx,.xls" onChange={(e) => setFile(e.target.files[0])} className="hidden" data-testid="excel-input"/>
              <span className="text-sm text-slate-700">{file ? file.name : "Clique para selecionar um ficheiro .xlsx"}</span>
            </label>
            <p className="text-xs text-slate-500 mt-2">Colunas suportadas: Ciclo, Ano, Disciplina, Editora, Título, ISBN, Artigo, PVP, Autor(es)</p>
          </div>
          <Button onClick={runPreview} disabled={!file || loading} className="bg-[#5A8F1E] hover:bg-[#3E6E11] text-white" data-testid="import-preview-btn">
            <ArrowRight className="w-4 h-4 mr-2"/> {loading ? "A analisar..." : "Analisar ficheiro"}
          </Button>
        </>
      )}

      {/* STEP 2 — preview summary + confirm */}
      {preview && (
        <div data-testid="import-preview">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded">
              <div className="flex items-center gap-2"><Plus className="w-4 h-4 text-emerald-600"/><div className="text-2xl font-display font-medium text-emerald-700" data-testid="preview-new">{preview.summary.new}</div></div>
              <div className="text-xs uppercase tracking-wider text-emerald-600 mt-1">Novos</div>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded">
              <div className="flex items-center gap-2"><RefreshCw className="w-4 h-4 text-blue-600"/><div className="text-2xl font-display font-medium text-blue-700" data-testid="preview-update">{preview.summary.update}</div></div>
              <div className="text-xs uppercase tracking-wider text-blue-600 mt-1">A atualizar</div>
            </div>
            <div className="p-4 bg-rose-50 border border-rose-200 rounded">
              <div className="flex items-center gap-2"><AlertCircle className="w-4 h-4 text-rose-600"/><div className="text-2xl font-display font-medium text-rose-700" data-testid="preview-errors">{preview.summary.errors}</div></div>
              <div className="text-xs uppercase tracking-wider text-rose-600 mt-1">Com erro (ignorados)</div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded overflow-hidden mb-6">
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="text-[10px] uppercase tracking-wider text-slate-500 bg-slate-50 sticky top-0">
                  <tr><th className="text-left p-3 w-16">Linha</th><th className="text-left p-3">ISBN</th><th className="text-left p-3">Título</th><th className="text-left p-3 w-28">Ação</th></tr>
                </thead>
                <tbody>
                  {preview.preview.map((r, i) => (
                    <tr key={i} className="border-t border-slate-100" data-testid={`preview-row-${i}`}>
                      <td className="p-3 text-xs text-slate-400 font-mono">{r.line}</td>
                      <td className="p-3 font-mono text-xs">{r.isbn || "—"}</td>
                      <td className="p-3">
                        <div className="truncate max-w-xs">{r.title || "—"}</div>
                        {r.action === "error" && <div className="text-xs text-rose-600 mt-0.5">{r.issue}</div>}
                      </td>
                      <td className="p-3"><span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded ${ACTION_STYLE[r.action]}`}>{ACTION_LABEL[r.action]}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {preview.summary.errors > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded p-3 mb-6 text-sm text-amber-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0"/>
              <span>{preview.summary.errors} {preview.summary.errors === 1 ? "linha será ignorada" : "linhas serão ignoradas"} por dados inválidos. Apenas as linhas válidas ({preview.summary.new + preview.summary.update}) serão gravadas.</span>
            </div>
          )}

          <div className="flex gap-3">
            <Button onClick={confirmImport} disabled={loading || (preview.summary.new + preview.summary.update === 0)} className="bg-[#5A8F1E] hover:bg-[#3E6E11] text-white" data-testid="import-confirm-btn">
              <CheckCircle2 className="w-4 h-4 mr-2"/> {loading ? "A importar..." : `Confirmar importação (${preview.summary.new + preview.summary.update})`}
            </Button>
            <Button onClick={reset} variant="outline" disabled={loading} data-testid="import-cancel-btn">
              <RotateCcw className="w-4 h-4 mr-2"/> Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3 — committed result */}
      {committed && (
        <div className="bg-white border border-slate-200 rounded p-6" data-testid="import-result">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-emerald-600"/>
            <h2 className="font-display text-lg font-medium">Importação concluída</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded">
              <div className="text-2xl font-display font-medium text-emerald-700">{committed.created}</div>
              <div className="text-xs uppercase tracking-wider text-emerald-600">Novos criados</div>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded">
              <div className="text-2xl font-display font-medium text-blue-700">{committed.updated}</div>
              <div className="text-xs uppercase tracking-wider text-blue-600">Atualizados</div>
            </div>
          </div>
          <Button onClick={reset} variant="outline" data-testid="import-again-btn">
            <Upload className="w-4 h-4 mr-2"/> Importar outro ficheiro
          </Button>
        </div>
      )}
    </div>
  );
}
