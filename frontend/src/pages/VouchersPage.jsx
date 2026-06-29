import { useMemo, useState } from "react";
import api, { formatApiErrorDetail } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import SEO from "@/components/SEO";
import { toast } from "sonner";
import { Upload, Check, FileText, X, AlertCircle } from "lucide-react";

const ALN_REGEX = /^ALN\d{24}$/;

export default function VouchersPage() {
  const [form, setForm] = useState({
    name: "",
    contact: "",
    code: "",
    manuals: "",
    wants_workbooks: false,
    wants_lamination: false,
    lamination_details: "",
  });
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const codeError = useMemo(() => {
    const c = form.code.trim();
    if (!c) return "";
    if (!ALN_REGEX.test(c)) return "Formato inválido. Deve ser ALN seguido de exatamente 24 dígitos.";
    return "";
  }, [form.code]);

  const codeOk = form.code.trim() && !codeError;
  const hasCredential = codeOk || !!file;
  const canSubmit = form.name.trim() && form.contact.trim() && form.manuals.trim() && hasCredential && !submitting;

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".pdf")) { toast.error("Apenas ficheiros PDF são aceites"); return; }
    if (f.size > 5 * 1024 * 1024) { toast.error("Ficheiro demasiado grande (máx 5 MB)"); return; }
    setFile(f);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const code = form.code.trim().toUpperCase();
      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("name", form.name);
        fd.append("contact", form.contact);
        fd.append("manuals", form.manuals);
        if (code) fd.append("code", code);
        fd.append("wants_workbooks", String(form.wants_workbooks));
        fd.append("wants_lamination", String(form.wants_lamination));
        if (form.wants_lamination && form.lamination_details.trim()) {
          fd.append("lamination_details", form.lamination_details.trim());
        }
        await api.post("/vouchers/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      } else {
        await api.post("/vouchers", {
          name: form.name,
          contact: form.contact,
          manuals: form.manuals,
          code,
          wants_workbooks: form.wants_workbooks,
          wants_lamination: form.wants_lamination,
          lamination_details: form.wants_lamination ? form.lamination_details.trim() : null,
        });
      }
      setDone(true);
      toast.success("Voucher submetido. Vamos analisar e entraremos em contacto.");
      setForm({ name: "", contact: "", code: "", manuals: "", wants_workbooks: false, wants_lamination: false, lamination_details: "" });
      setFile(null);
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail));
    } finally { setSubmitting(false); }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16" data-testid="vouchers-page">
      <SEO title="Submeter Voucher MEGA" path="/vouchers" description="Submeta o seu voucher MEGA para manuais escolares. Preencha o pedido com nome, contacto, código ALN ou PDF, e os manuais pretendidos."/>
      <div className="text-[10px] tracking-[0.2em] uppercase text-[#4A5568] font-semibold mb-2">Vouchers Escolares</div>
      <h1 className="font-display text-3xl md:text-4xl font-medium mb-3">Submeter Voucher MEGA</h1>
      <p className="text-[#4A5568] mb-10 max-w-2xl">
        Preencha o formulário com os seus dados e indique o código ALN ou anexe o PDF do voucher. Validamos em 24h úteis e contactamos para combinar a entrega.
      </p>

      <div className="grid md:grid-cols-12 gap-10">
        <form onSubmit={submit} className="md:col-span-7 bg-white border border-[#E2E8F0] rounded-md p-6 space-y-5" data-testid="vouchers-form">
          {/* Nome */}
          <div>
            <Label className="text-xs uppercase tracking-wider text-[#4A5568] mb-1.5 block">Nome do encarregado de educação / aluno *</Label>
            <Input required value={form.name} onChange={(e)=>setForm({...form, name: e.target.value})} placeholder="Nome completo" data-testid="voucher-name-input"/>
          </div>

          {/* Contacto */}
          <div>
            <Label className="text-xs uppercase tracking-wider text-[#4A5568] mb-1.5 block">Contacto (telefone ou email) *</Label>
            <Input required value={form.contact} onChange={(e)=>setForm({...form, contact: e.target.value})} placeholder="+351 ... ou email@exemplo.com" data-testid="voucher-contact-input"/>
          </div>

          {/* Código ALN */}
          <div className="bg-[#F5F8EC] rounded-md p-4 border border-[#E2E8F0]">
            <Label className="text-xs uppercase tracking-wider text-[#1A202C] mb-1.5 block font-semibold">Código do voucher ALN <span className="text-[#4A5568] normal-case font-normal">— OU anexe o PDF abaixo</span></Label>
            <Input
              value={form.code}
              onChange={(e)=>setForm({...form, code: e.target.value.toUpperCase().replace(/\s/g, "")})}
              placeholder="ALN521619175136193552181116"
              className={`font-mono text-sm ${codeError ? 'border-[#C53030]' : (codeOk ? 'border-[#5A8F1E]' : '')}`}
              maxLength={27}
              data-testid="voucher-code-input"
            />
            {codeError && (
              <p className="text-xs text-[#C53030] mt-1.5 flex items-start gap-1" data-testid="voucher-code-error">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0"/> {codeError}
              </p>
            )}
            {codeOk && (
              <p className="text-xs text-[#2F855A] mt-1.5 flex items-center gap-1"><Check className="w-3.5 h-3.5"/> Código válido</p>
            )}
            <p className="text-[11px] text-[#4A5568] mt-2">Formato: "ALN" seguido de 24 dígitos (sem espaços).</p>
          </div>

          {/* PDF */}
          <div>
            <Label className="text-xs uppercase tracking-wider text-[#4A5568] mb-1.5 block">Anexar PDF do voucher (alternativa ao código)</Label>
            {file ? (
              <div className="flex items-center justify-between bg-[#F5F8EC] border border-[#E2E8F0] rounded p-3" data-testid="voucher-file-selected">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-[#5A8F1E] shrink-0"/>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{file.name}</div>
                    <div className="text-xs text-[#4A5568]">{(file.size / 1024).toFixed(0)} KB</div>
                  </div>
                </div>
                <button type="button" onClick={() => setFile(null)} className="text-[#4A5568] hover:text-[#C53030] p-1" data-testid="voucher-file-remove"><X className="w-4 h-4"/></button>
              </div>
            ) : (
              <label className="block cursor-pointer">
                <input type="file" accept="application/pdf,.pdf" onChange={onFile} className="hidden" data-testid="voucher-pdf-file"/>
                <div className="border-2 border-dashed border-[#CBD5E0] rounded p-5 text-center hover:border-[#5A8F1E] hover:bg-[#F5F8EC] transition-colors">
                  <Upload className="w-5 h-5 text-[#4A5568] mx-auto mb-1.5" strokeWidth={1.5}/>
                  <div className="text-sm text-[#1A202C]">Clique para selecionar PDF</div>
                  <div className="text-xs text-[#4A5568] mt-1">Máximo 5 MB · O ficheiro fica privado, só visível ao administrador</div>
                </div>
              </label>
            )}
          </div>

          {/* Manuais pretendidos */}
          <div>
            <Label className="text-xs uppercase tracking-wider text-[#4A5568] mb-1.5 block">Manuais / disciplinas pretendidos *</Label>
            <Textarea
              required
              value={form.manuals}
              onChange={(e)=>setForm({...form, manuals: e.target.value})}
              placeholder="Ex: Manual de Português 5.º ano, Manual de Matemática 5.º ano, ..."
              rows={4}
              data-testid="voucher-manuals-input"
            />
          </div>

          {/* Checkboxes */}
          <div className="space-y-3 pt-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox checked={form.wants_workbooks} onCheckedChange={(v) => setForm({...form, wants_workbooks: !!v})} data-testid="voucher-want-workbooks"/>
              <span className="text-sm leading-snug">
                <span className="font-medium text-[#1A202C]">Quero cadernos de fichas</span>
                <span className="block text-xs text-[#4A5568]">Incluir os cadernos de atividades correspondentes aos manuais.</span>
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox checked={form.wants_lamination} onCheckedChange={(v) => setForm({...form, wants_lamination: !!v, lamination_details: v ? form.lamination_details : ""})} data-testid="voucher-want-lamination"/>
              <span className="text-sm leading-snug">
                <span className="font-medium text-[#1A202C]">Quero plastificação dos manuais</span>
                <span className="block text-xs text-[#4A5568]">+2€ por manual. Cadernos de fichas não são plastificados.</span>
              </span>
            </label>
            {form.wants_lamination && (
              <div className="pl-7" data-testid="voucher-lamination-details-wrap">
                <Label className="text-xs uppercase tracking-wider text-[#4A5568] mb-1.5 block">Em quais manuais quer plastificação?</Label>
                <Textarea
                  value={form.lamination_details}
                  onChange={(e)=>setForm({...form, lamination_details: e.target.value})}
                  placeholder="Ex: Manual de Português 5.º ano, Manual de Matemática 5.º ano"
                  rows={3}
                  data-testid="voucher-lamination-details-input"
                />
                <p className="text-[11px] text-[#4A5568] mt-1.5">Indique apenas os manuais que pretende plastificar (pode escolher só alguns).</p>
              </div>
            )}
          </div>

          {/* Aviso credencial */}
          {!hasCredential && (form.name || form.contact || form.manuals) && (
            <div className="bg-[#FFF8E1] border border-[#FFE082] rounded p-3 text-xs text-[#8B5A00] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0"/>
              <span>Insira um código ALN válido <strong>ou</strong> anexe o PDF do voucher.</span>
            </div>
          )}

          <Button type="submit" disabled={!canSubmit} className="w-full h-11 bg-[#5A8F1E] hover:bg-[#3E6E11] disabled:bg-[#A0AEC0] disabled:hover:bg-[#A0AEC0] text-white" data-testid="submit-voucher-btn">
            <Upload className="w-4 h-4 mr-2" strokeWidth={1.5}/> {submitting ? "A enviar..." : "Submeter voucher"}
          </Button>

          {done && (
            <div className="bg-[#F0FFF4] border border-[#C6F6D5] rounded p-3 flex items-start gap-2 text-sm" data-testid="voucher-submitted">
              <Check className="w-4 h-4 text-[#2F855A] mt-0.5"/>
              <span>Voucher recebido. Entraremos em contacto após análise (em 24h úteis).</span>
            </div>
          )}
        </form>

        <div className="md:col-span-5 space-y-4 text-sm text-[#4A5568] leading-relaxed">
          <h3 className="font-display text-lg font-medium text-[#1A202C]">Como funciona</h3>
          <ol className="space-y-3 list-decimal list-inside">
            <li>Preenche o formulário com nome, contacto e manuais pretendidos.</li>
            <li>Indica o código ALN <strong>ou</strong> anexa o PDF do voucher.</li>
            <li>Validamos em 24h úteis e entramos em contacto para combinar a entrega em mão.</li>
          </ol>
          <div className="bg-[#F5F8EC] rounded p-4 mt-6">
            <div className="font-display font-medium text-[#1A202C] mb-1">Privacidade</div>
            <p className="text-xs">O PDF é guardado em armazenamento privado, acessível apenas pelo administrador. É eliminado automaticamente 12 meses após a utilização (RGPD).</p>
          </div>
        </div>
      </div>
    </div>
  );
}
