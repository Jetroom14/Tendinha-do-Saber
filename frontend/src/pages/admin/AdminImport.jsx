import { useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function AdminImport() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const submit = async () => {
    if (!file) { toast.error("Selecione um ficheiro Excel"); return; }
    setLoading(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const { data } = await api.post("/admin/books/import", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setResult(data);
      toast.success(`Importação concluída: ${data.created} novos · ${data.updated} atualizados`);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Erro na importação");
    } finally { setLoading(false); }
  };

  return (
    <div className="p-8 max-w-4xl" data-testid="admin-import">
      <div className="mb-8">
        <div className="text-[10px] tracking-[0.2em] uppercase text-slate-500 font-semibold">Catálogo</div>
        <h1 className="font-display text-3xl font-medium text-slate-900">Importar Excel</h1>
        <p className="text-sm text-slate-600 mt-2">Faça upload do ficheiro Excel para criar ou atualizar livros. ISBNs existentes são atualizados (preço, stock), os campos editados manualmente (sinopse, imagem) são preservados.</p>
      </div>

      <div className="bg-white border-2 border-dashed border-slate-300 rounded p-12 text-center mb-6">
        <FileSpreadsheet className="w-12 h-12 text-slate-400 mx-auto mb-4" strokeWidth={1.5}/>
        <label className="cursor-pointer">
          <input type="file" accept=".xlsx,.xls" onChange={(e)=>setFile(e.target.files[0])} className="hidden" data-testid="excel-input"/>
          <span className="text-sm text-slate-700">{file ? file.name : "Clique para selecionar um ficheiro .xlsx"}</span>
        </label>
        <p className="text-xs text-slate-500 mt-2">Colunas suportadas: Ciclo, Ano, Disciplina, Editora, Título, ISBN, Artigo, PVP, Autor(es)</p>
      </div>

      <Button onClick={submit} disabled={!file || loading} className="bg-[#5A8F1E] hover:bg-[#3E6E11] text-white" data-testid="import-submit-btn">
        <Upload className="w-4 h-4 mr-2"/> {loading ? "A importar..." : "Importar"}
      </Button>

      {result && (
        <div className="mt-8 bg-white border border-slate-200 rounded p-6 space-y-3" data-testid="import-result">
          <h2 className="font-display text-lg font-medium">Resultado da importação</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded">
              <div className="text-2xl font-display font-medium text-emerald-700">{result.created}</div>
              <div className="text-xs uppercase tracking-wider text-emerald-600">Novos</div>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded">
              <div className="text-2xl font-display font-medium text-blue-700">{result.updated}</div>
              <div className="text-xs uppercase tracking-wider text-blue-600">Atualizados</div>
            </div>
            <div className="p-4 bg-rose-50 border border-rose-200 rounded">
              <div className="text-2xl font-display font-medium text-rose-700">{result.anomalies}</div>
              <div className="text-xs uppercase tracking-wider text-rose-600">Anomalias</div>
            </div>
          </div>
          {result.issues?.length > 0 && (
            <div className="mt-4">
              <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Detalhes ({result.issues.length})</div>
              <div className="max-h-60 overflow-y-auto bg-slate-50 rounded p-3 text-xs space-y-1">
                {result.issues.map((i, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0"/>
                    <span>{i.isbn || "?"} · {i.title || "—"} · {i.issue}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
