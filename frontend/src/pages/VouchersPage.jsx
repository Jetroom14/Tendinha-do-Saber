import { useState } from "react";
import api, { formatApiErrorDetail } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Upload, Check, FileText, X } from "lucide-react";

const MAX_MB = 8;

export default function VouchersPage() {
  const [form, setForm] = useState({ code: "", notes: "" });
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const pickFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) { setFile(null); return; }
    if (f.type !== "application/pdf") { toast.error("O ficheiro tem de ser um PDF."); e.target.value = ""; return; }
    if (f.size > MAX_MB * 1024 * 1024) { toast.error(`O PDF não pode exceder ${MAX_MB}MB.`); e.target.value = ""; return; }
    setFile(f);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.code && !file) { toast.error("Indique um código ou anexe o PDF do voucher"); return; }
    setSubmitting(true);
    try {
      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        if (form.code) fd.append("code", form.code);
        if (form.notes) fd.append("notes", form.notes);
        await api.post("/vouchers/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      } else {
        await api.post("/vouchers", { code: form.code, notes: form.notes });
      }
      setDone(true);
      toast.success("Voucher submetido. Iremos analisar e contactar.");
      setForm({ code: "", notes: "" });
      setFile(null);
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail));
    } finally { setSubmitting(false); }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16" data-testid="vouchers-page">
      <div className="text-[10px] tracking-[0.2em] uppercase text-[#4A5568] font-semibold mb-2">Vouchers Escolares</div>
      <h1 className="font-display text-3xl md:text-4xl font-medium mb-3">Submeter Voucher</h1>
      <p className="text-[#4A5568] mb-10 max-w-2xl">
        Se a sua escola ou município lhe atribuiu um voucher de manuais, submeta-o aqui. Iremos validar e descontar no momento do pagamento.
      </p>

      <div className="grid md:grid-cols-12 gap-10">
        <form onSubmit={submit} className="md:col-span-7 bg-white border border-[#E2E8F0] rounded-md p-6 space-y-5">
          <div>
            <Label className="text-xs uppercase tracking-wider text-[#4A5568] mb-1.5 block">Código do voucher</Label>
            <Input value={form.code} onChange={(e)=>setForm({...form, code: e.target.value.toUpperCase()})} placeholder="EX: VC-2025-XXXXX" data-testid="voucher-code-input"/>
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider text-[#4A5568] mb-1.5 block">PDF do voucher</Label>
            {file ? (
              <div className="flex items-center justify-between gap-2 border border-[#E2E8F0] rounded-md px-3 py-2.5 bg-[#F5F8EC]" data-testid="voucher-file-chip">
                <span className="flex items-center gap-2 text-sm text-[#1A202C] min-w-0">
                  <FileText className="w-4 h-4 text-[#5A8F1E] shrink-0" strokeWidth={1.5}/>
                  <span className="truncate">{file.name}</span>
                </span>
                <button type="button" onClick={()=>setFile(null)} className="text-[#4A5568] hover:text-[#C53030] shrink-0" data-testid="voucher-file-remove"><X className="w-4 h-4"/></button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 border border-dashed border-[#CBD5E0] rounded-md px-4 py-8 cursor-pointer hover:border-[#5A8F1E] hover:bg-[#F5F8EC] transition-colors" data-testid="voucher-file-dropzone">
                <Upload className="w-5 h-5 text-[#4A5568]" strokeWidth={1.5}/>
                <span className="text-sm text-[#4A5568]">Clique para anexar o PDF (máx. {MAX_MB}MB)</span>
                <input type="file" accept="application/pdf" onChange={pickFile} className="hidden" data-testid="voucher-pdf-input"/>
              </label>
            )}
            <p className="text-xs text-[#4A5568] mt-1.5">O ficheiro é guardado de forma privada e segura, acessível apenas pela nossa equipa.</p>
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider text-[#4A5568] mb-1.5 block">Notas</Label>
            <Textarea value={form.notes} onChange={(e)=>setForm({...form, notes: e.target.value})} placeholder="Escola, ano de escolaridade, nome do aluno..." data-testid="voucher-notes-input"/>
          </div>
          <Button type="submit" disabled={submitting} className="w-full h-11 bg-[#5A8F1E] hover:bg-[#3E6E11] text-white" data-testid="submit-voucher-btn">
            <Upload className="w-4 h-4 mr-2" strokeWidth={1.5}/> {submitting ? "A enviar..." : "Submeter voucher"}
          </Button>
          {done && (
            <div className="bg-[#F0FFF4] border border-[#C6F6D5] rounded p-3 flex items-start gap-2 text-sm" data-testid="voucher-submitted">
              <Check className="w-4 h-4 text-[#2F855A] mt-0.5"/>
              <span>Voucher recebido. Entraremos em contacto após análise.</span>
            </div>
          )}
        </form>

        <div className="md:col-span-5 space-y-4 text-sm text-[#4A5568] leading-relaxed">
          <h3 className="font-display text-lg font-medium text-[#1A202C]">Como funciona</h3>
          <ol className="space-y-3 list-decimal list-inside">
            <li>Submete o código ou o PDF do voucher.</li>
            <li>A nossa equipa valida em 24h úteis.</li>
            <li>Receberá email com a confirmação e o desconto associado à sua encomenda.</li>
          </ol>
          <div className="bg-[#F5F8EC] rounded p-4 mt-6">
            <div className="font-display font-medium text-[#1A202C] mb-1">Privacidade</div>
            <p className="text-xs">Todos os vouchers são armazenados de forma privada e usados exclusivamente para validar a sua compra.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
