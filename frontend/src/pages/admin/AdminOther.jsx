import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FileText, Mail, Phone, User as UserIcon, BookOpen, Layers, Save } from "lucide-react";

const STATUS_COLORS = {
  Pending: "bg-amber-100 text-amber-800",
  Pendente: "bg-amber-100 text-amber-800",
  "Em processamento": "bg-sky-100 text-sky-800",
  Validated: "bg-emerald-100 text-emerald-800",
  "Concluído": "bg-emerald-100 text-emerald-800",
  Used: "bg-blue-100 text-blue-800",
  Rejected: "bg-rose-100 text-rose-800",
};

const STATUS_LABEL = {
  Pending: "Pendente",
  Pendente: "Pendente",
  "Em processamento": "Em processamento",
  "Concluído": "Concluído",
  Validated: "Validado",
  Used: "Utilizado",
  Rejected: "Rejeitado",
};

// Voucher PDFs live in a private bucket; fetch them through the
// authenticated admin endpoint (Bearer token) and open the blob, so no
// public URL is ever exposed.
async function openVoucherPdf(id) {
  try {
    const res = await api.get(`/admin/vouchers/${id}/pdf`, { responseType: "blob" });
    const url = URL.createObjectURL(res.data);
    window.open(url, "_blank", "noopener");
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch {
    toast.error("Não foi possível abrir o PDF (pode ter sido removido por retenção RGPD).");
  }
}

function VoucherCard({ v, onUpdated }) {
  const [note, setNote] = useState(v.notes || "");
  const [savingNote, setSavingNote] = useState(false);
  const dirty = (note || "") !== (v.notes || "");

  const saveNote = async () => {
    setSavingNote(true);
    try {
      const fd = new FormData();
      fd.append("note", note);
      await api.put(`/admin/vouchers/${v.id}/note`, fd);
      toast.success("Nota interna guardada");
      onUpdated?.();
    } catch {
      toast.error("Erro ao guardar nota");
    } finally { setSavingNote(false); }
  };

  const updateStatus = async (status) => {
    const fd = new FormData(); fd.append("status", status);
    try {
      await api.put(`/admin/vouchers/${v.id}/status`, fd);
      toast.success(`Estado atualizado para "${STATUS_LABEL[status] || status}"`);
      onUpdated?.();
    } catch {
      toast.error("Erro ao atualizar estado");
    }
  };

  const submittedAt = v.created_at
    ? new Date(v.created_at).toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "short" })
    : "—";

  return (
    <div className="bg-white border border-slate-200 rounded-md p-5 space-y-4" data-testid={`voucher-card-${v.id}`}>
      {/* Cabeçalho: data + estado + alterador */}
      <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[11px] text-slate-500" data-testid={`voucher-date-${v.id}`}>{submittedAt}</span>
          <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded ${STATUS_COLORS[v.status] || "bg-slate-100 text-slate-700"}`} data-testid={`voucher-status-badge-${v.id}`}>
            {STATUS_LABEL[v.status] || v.status}
          </span>
        </div>
        <Select value={v.status} onValueChange={updateStatus}>
          <SelectTrigger className="h-8 w-44" data-testid={`voucher-status-${v.id}`}><SelectValue/></SelectTrigger>
          <SelectContent>
            <SelectItem value="Pendente">Pendente</SelectItem>
            <SelectItem value="Em processamento">Em processamento</SelectItem>
            <SelectItem value="Concluído">Concluído</SelectItem>
            <SelectItem value="Rejected">Rejeitado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cliente */}
      <div className="grid sm:grid-cols-2 gap-3 text-sm">
        <div className="flex items-start gap-2 min-w-0">
          <UserIcon className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" strokeWidth={1.5}/>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-slate-500">Nome</div>
            <div className="text-slate-900 truncate" data-testid={`voucher-name-${v.id}`}>{v.name || "—"}</div>
          </div>
        </div>
        <div className="flex items-start gap-2 min-w-0">
          {(v.contact || "").includes("@") ? <Mail className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" strokeWidth={1.5}/> : <Phone className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" strokeWidth={1.5}/>}
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-slate-500">Contacto</div>
            <div className="text-slate-900 truncate" data-testid={`voucher-contact-${v.id}`}>{v.contact || "—"}</div>
          </div>
        </div>
      </div>

      {/* Código / PDF */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Código ALN</div>
          {v.code ? (
            <div className="font-mono text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 inline-block" data-testid={`voucher-code-${v.id}`}>{v.code}</div>
          ) : (
            <div className="text-xs text-slate-400">— (não inserido)</div>
          )}
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">PDF anexo</div>
          {v.pdf_storage_path ? (
            <button onClick={() => openVoucherPdf(v.id)} className="inline-flex items-center gap-1 text-[#5A8F1E] hover:underline text-xs" data-testid={`voucher-pdf-${v.id}`}>
              <FileText className="w-3.5 h-3.5"/> Ver / descarregar PDF
            </button>
          ) : v.pdf_url ? (
            <a href={v.pdf_url} target="_blank" rel="noreferrer" className="text-[#5A8F1E] hover:underline text-xs">Link externo</a>
          ) : (
            <div className="text-xs text-slate-400">— (sem PDF)</div>
          )}
        </div>
      </div>

      {/* Manuais pretendidos */}
      <div>
        <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5"/> Manuais pretendidos</div>
        <div className="text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded p-3 whitespace-pre-wrap" data-testid={`voucher-manuals-${v.id}`}>{v.manuals || "—"}</div>
      </div>

      {/* Cadernos + Plastificação */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="border border-slate-200 rounded p-3">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Cadernos de fichas</div>
          <div className={`text-sm font-medium ${v.wants_workbooks ? "text-emerald-700" : "text-slate-400"}`} data-testid={`voucher-workbooks-${v.id}`}>
            {v.wants_workbooks ? "Sim" : "Não"}
          </div>
        </div>
        <div className="border border-slate-200 rounded p-3">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5"><Layers className="w-3.5 h-3.5"/> Plastificação</div>
          <div className={`text-sm font-medium ${v.wants_lamination ? "text-emerald-700" : "text-slate-400"}`} data-testid={`voucher-lamination-${v.id}`}>
            {v.wants_lamination ? "Sim" : "Não"}
          </div>
          {v.wants_lamination && v.lamination_details && (
            <div className="mt-2 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded p-2 whitespace-pre-wrap" data-testid={`voucher-lamination-details-${v.id}`}>
              {v.lamination_details}
            </div>
          )}
        </div>
      </div>

      {/* Nota interna */}
      <div className="pt-2 border-t border-slate-100">
        <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5">Nota interna (apenas admin)</div>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ex: Valor a pagar — Cadernos 24,40€ + Plastificação 4€ = 28,40€"
          rows={2}
          data-testid={`voucher-note-input-${v.id}`}
        />
        <div className="flex justify-end mt-2">
          <Button size="sm" onClick={saveNote} disabled={!dirty || savingNote} className="bg-[#5A8F1E] hover:bg-[#3E6E11] disabled:bg-slate-300" data-testid={`voucher-note-save-${v.id}`}>
            <Save className="w-3.5 h-3.5 mr-1.5"/> {savingNote ? "A guardar..." : "Guardar nota"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AdminVouchers() {
  const [vouchers, setVouchers] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const qs = filter !== "all" ? `?status=${encodeURIComponent(filter)}` : "";
      const { data } = await api.get(`/admin/vouchers${qs}`);
      // Backend already sorts by created_at desc; ensure on client too in case of legacy docs
      const sorted = [...data].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      setVouchers(sorted);
    } catch {
      toast.error("Erro ao carregar vouchers");
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  return (
    <div className="p-8" data-testid="admin-vouchers">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-[10px] tracking-[0.2em] uppercase text-slate-500 font-semibold">Vouchers</div>
          <h1 className="font-display text-3xl font-medium text-slate-900">Vales MEGA</h1>
          <p className="text-sm text-slate-500 mt-1">Lista de vouchers submetidos pelos clientes, do mais recente para o mais antigo.</p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-52" data-testid="voucher-filter"><SelectValue/></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="Pendente">Pendentes</SelectItem>
            <SelectItem value="Em processamento">Em processamento</SelectItem>
            <SelectItem value="Concluído">Concluídos</SelectItem>
            <SelectItem value="Rejected">Rejeitados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded p-10 text-center text-sm text-slate-500">A carregar...</div>
      ) : vouchers.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded p-10 text-center text-sm text-slate-500" data-testid="vouchers-empty">Sem vouchers.</div>
      ) : (
        <div className="space-y-4">
          {vouchers.map((v) => (
            <VoucherCard key={v.id} v={v} onUpdated={load}/>
          ))}
        </div>
      )}
    </div>
  );
}

export function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("all");

  const load = async () => {
    const qs = filter !== "all" ? `?status=${filter}` : "";
    const { data } = await api.get(`/admin/orders${qs}`);
    setOrders(data);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  const updateStatus = async (orderNo, status) => {
    const fd = new FormData(); fd.append("status", status);
    await api.put(`/admin/orders/${orderNo}/status`, fd);
    toast.success(`Encomenda ${orderNo} atualizada`); load();
  };

  return (
    <div className="p-8" data-testid="admin-orders">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-[10px] tracking-[0.2em] uppercase text-slate-500 font-semibold">Encomendas</div>
          <h1 className="font-display text-3xl font-medium text-slate-900">Gestão de Encomendas</h1>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48"><SelectValue/></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="pending_payment">Aguarda Pagamento</SelectItem>
            <SelectItem value="paid">Paga</SelectItem>
            <SelectItem value="preparing">Em Preparação</SelectItem>
            <SelectItem value="ready">Pronta</SelectItem>
            <SelectItem value="delivered">Entregue</SelectItem>
            <SelectItem value="cancelled">Cancelada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white border border-slate-200 rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-[10px] uppercase tracking-wider text-slate-500 bg-slate-50">
            <tr><th className="text-left p-3">Nº</th><th className="text-left p-3">Data</th><th className="text-left p-3">Cliente</th><th className="text-left p-3">Entrega</th><th className="text-right p-3">Total</th><th className="text-right p-3">Estado</th></tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.order_no} className="border-t border-slate-100" data-testid={`order-row-${o.order_no}`}>
                <td className="p-3 font-mono text-xs">{o.order_no}</td>
                <td className="p-3 text-xs">{new Date(o.created_at).toLocaleDateString("pt-PT")}</td>
                <td className="p-3">{o.customer?.name}<div className="text-xs text-slate-500">{o.customer?.email}</div></td>
                <td className="p-3 text-xs">{o.delivery?.method === "hand_delivery" ? "Em mão" : o.delivery?.method === "shipping" ? "Envio" : "—"}</td>
                <td className="p-3 text-right font-mono">{o.totals?.total?.toFixed(2)}€</td>
                <td className="p-3 text-right">
                  <Select value={o.status} onValueChange={(s) => updateStatus(o.order_no, s)}>
                    <SelectTrigger className="h-8 w-40 inline-flex" data-testid={`order-status-${o.order_no}`}><SelectValue/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending_payment">Aguarda Pagamento</SelectItem>
                      <SelectItem value="paid">Paga</SelectItem>
                      <SelectItem value="preparing">Em Preparação</SelectItem>
                      <SelectItem value="ready">Pronta</SelectItem>
                      <SelectItem value="delivered">Entregue</SelectItem>
                      <SelectItem value="cancelled">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td colSpan={6} className="p-10 text-center text-slate-500">Sem encomendas.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminPartners() {
  const [partners, setPartners] = useState([]);
  const [form, setForm] = useState({ name: "", logo_url: "", description: "", promo_code: "", discount_value: 5 });

  const load = async () => { const { data } = await api.get("/partners"); setPartners(data); };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.name || !form.promo_code) { toast.error("Nome e código são obrigatórios"); return; }
    try {
      await api.post("/admin/partners", { ...form, promo_code: form.promo_code.toUpperCase(), discount_value: parseFloat(form.discount_value) });
      toast.success("Parceiro criado"); setForm({ name: "", logo_url: "", description: "", promo_code: "", discount_value: 5 }); load();
    } catch (e) { toast.error(e.response?.data?.detail || "Erro"); }
  };
  const remove = async (id) => {
    if (!confirm("Eliminar parceiro?")) return;
    await api.delete(`/admin/partners/${id}`); toast.success("Eliminado"); load();
  };

  return (
    <div className="p-8" data-testid="admin-partners">
      <div className="mb-6">
        <div className="text-[10px] tracking-[0.2em] uppercase text-slate-500 font-semibold">Parceiros</div>
        <h1 className="font-display text-3xl font-medium text-slate-900">Códigos de Desconto</h1>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase tracking-wider text-slate-500 bg-slate-50">
              <tr><th className="text-left p-3">Parceiro</th><th className="text-left p-3">Código</th><th className="text-center p-3">Desconto</th><th className="p-3"></th></tr>
            </thead>
            <tbody>
              {partners.map((p) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="p-3 flex items-center gap-3">
                    {p.logo_url && <img src={p.logo_url} alt="" className="w-8 h-8 rounded object-cover"/>}
                    <div><div className="font-medium">{p.name}</div><div className="text-xs text-slate-500">{p.description}</div></div>
                  </td>
                  <td className="p-3 font-mono text-xs">{p.promo_code}</td>
                  <td className="p-3 text-center">−{p.discount_value}%</td>
                  <td className="p-3"><button onClick={() => remove(p.id)} className="text-slate-400 hover:text-rose-600 p-1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="lg:col-span-4 bg-white border border-slate-200 rounded p-5">
          <h2 className="font-display text-lg font-medium mb-4">Novo parceiro</h2>
          <div className="space-y-3">
            <div><label className="text-xs uppercase tracking-wider text-slate-500">Nome *</label><input value={form.name} onChange={(e)=>setForm({...form, name: e.target.value})} className="w-full mt-1 px-3 py-2 border border-slate-300 rounded text-sm" data-testid="partner-form-name"/></div>
            <div><label className="text-xs uppercase tracking-wider text-slate-500">Código *</label><input value={form.promo_code} onChange={(e)=>setForm({...form, promo_code: e.target.value.toUpperCase()})} className="w-full mt-1 px-3 py-2 border border-slate-300 rounded text-sm font-mono" data-testid="partner-form-code"/></div>
            <div><label className="text-xs uppercase tracking-wider text-slate-500">Logo URL</label><input value={form.logo_url} onChange={(e)=>setForm({...form, logo_url: e.target.value})} className="w-full mt-1 px-3 py-2 border border-slate-300 rounded text-sm"/></div>
            <div><label className="text-xs uppercase tracking-wider text-slate-500">Descrição</label><textarea value={form.description} onChange={(e)=>setForm({...form, description: e.target.value})} className="w-full mt-1 px-3 py-2 border border-slate-300 rounded text-sm"/></div>
            <div><label className="text-xs uppercase tracking-wider text-slate-500">Desconto (%)</label><input type="number" value={form.discount_value} onChange={(e)=>setForm({...form, discount_value: e.target.value})} className="w-full mt-1 px-3 py-2 border border-slate-300 rounded text-sm"/></div>
            <button onClick={create} className="w-full bg-[#5A8F1E] hover:bg-[#3E6E11] text-white rounded py-2 text-sm" data-testid="partner-create-btn">Criar parceiro</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminLogs() {
  const [logs, setLogs] = useState([]);
  useEffect(() => { api.get("/admin/activity-logs?limit=200").then((r) => setLogs(r.data)); }, []);
  return (
    <div className="p-8" data-testid="admin-logs">
      <div className="mb-6">
        <div className="text-[10px] tracking-[0.2em] uppercase text-slate-500 font-semibold">Segurança</div>
        <h1 className="font-display text-3xl font-medium text-slate-900">Histórico de Atividade</h1>
      </div>
      <div className="bg-white border border-slate-200 rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-[10px] uppercase tracking-wider text-slate-500 bg-slate-50">
            <tr><th className="text-left p-3">Data</th><th className="text-left p-3">Admin</th><th className="text-left p-3">Ação</th><th className="text-left p-3">Entidade</th><th className="text-left p-3">Detalhes</th></tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-t border-slate-100">
                <td className="p-3 text-xs">{new Date(l.timestamp).toLocaleString("pt-PT")}</td>
                <td className="p-3 text-xs font-mono">{l.admin_id?.slice(0, 8)}</td>
                <td className="p-3 text-xs uppercase tracking-wider">{l.action_type}</td>
                <td className="p-3 text-xs">{l.entity}</td>
                <td className="p-3 text-xs text-slate-600">{l.entity_id ? <span className="font-mono">{l.entity_id.slice(0, 12)}</span> : ""} {l.details && Object.keys(l.details).length > 0 && <code className="text-[10px] bg-slate-100 px-1 rounded ml-1">{JSON.stringify(l.details).slice(0, 80)}</code>}</td>
              </tr>
            ))}
            {logs.length === 0 && <tr><td colSpan={5} className="p-10 text-center text-slate-500">Sem registos.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminSettings() {
  const [s, setS] = useState(null);
  useEffect(() => { api.get("/admin/settings").then((r) => setS(r.data)); }, []);

  const save = async () => {
    const payload = {
      lamination_price: parseFloat(s.lamination_price),
      shipping_flat_rate: s.shipping_flat_rate !== undefined && s.shipping_flat_rate !== "" ? parseFloat(s.shipping_flat_rate) : undefined,
      aveiro_postcodes: typeof s.aveiro_postcodes === "string"
        ? s.aveiro_postcodes.split(",").map((x) => x.trim()).filter(Boolean)
        : s.aveiro_postcodes,
      publisher_cover_template: s.publisher_cover_template || "",
      google_analytics_id: s.google_analytics_id || "",
      google_ads_id: s.google_ads_id || "",
      facebook_pixel_id: s.facebook_pixel_id || "",
      google_site_verification: s.google_site_verification || "",
      site_url: s.site_url || "",
    };
    const { data } = await api.put("/admin/settings", payload);
    setS(data); toast.success("Definições atualizadas");
  };

  const enrichCovers = async () => {
    try {
      const { data } = await api.post("/admin/books/enrich-covers?limit=200");
      toast.success(`Capas atualizadas: ${data.updated} livros`);
    } catch { toast.error("Erro ao enriquecer capas"); }
  };

  if (!s) return <div className="p-8 text-slate-500">A carregar...</div>;

  return (
    <div className="p-8 max-w-2xl" data-testid="admin-settings">
      <div className="mb-6">
        <div className="text-[10px] tracking-[0.2em] uppercase text-slate-500 font-semibold">Configuração</div>
        <h1 className="font-display text-3xl font-medium text-slate-900">Definições Gerais</h1>
      </div>
      <div className="bg-white border border-slate-200 rounded p-6 space-y-5">
        <div>
          <label className="text-xs uppercase tracking-wider text-slate-500">Preço da plastificação (€)</label>
          <input type="number" step="0.01" value={s.lamination_price} onChange={(e)=>setS({...s, lamination_price: e.target.value})} className="w-full mt-1 px-3 py-2 border border-slate-300 rounded" data-testid="settings-lamination"/>
        </div>
        <div>
          <label className="text-xs uppercase tracking-wider text-slate-500">Custo de envio por transportadora (€)</label>
          <input type="number" step="0.01" value={s.shipping_flat_rate ?? ""} onChange={(e)=>setS({...s, shipping_flat_rate: e.target.value})} className="w-full mt-1 px-3 py-2 border border-slate-300 rounded" data-testid="settings-shipping"/>
          <p className="text-xs text-slate-500 mt-1">Valor cobrado quando o cliente escolhe "Envio por transportadora" no checkout.</p>
        </div>
        <div>
          <label className="text-xs uppercase tracking-wider text-slate-500">Prefixos postais de Aveiro (entrega em mão)</label>
          <input value={Array.isArray(s.aveiro_postcodes) ? s.aveiro_postcodes.join(", ") : s.aveiro_postcodes} onChange={(e)=>setS({...s, aveiro_postcodes: e.target.value})} className="w-full mt-1 px-3 py-2 border border-slate-300 rounded font-mono text-sm" data-testid="settings-postcodes"/>
          <p className="text-xs text-slate-500 mt-1">Separar por vírgula. Ex: 3800, 3810, 3830</p>
        </div>
        <div>
          <label className="text-xs uppercase tracking-wider text-slate-500">Modelo de URL das capas da editora (opcional)</label>
          <input value={s.publisher_cover_template ?? ""} onChange={(e)=>setS({...s, publisher_cover_template: e.target.value})} className="w-full mt-1 px-3 py-2 border border-slate-300 rounded font-mono text-sm" placeholder="https://.../capas/{isbn}.jpg" data-testid="settings-cover-template"/>
          <p className="text-xs text-slate-500 mt-1">
            Use <code className="bg-slate-100 px-1 rounded">{"{isbn}"}</code> no lugar do ISBN. Quando os manuais ficarem à venda na editora (ex: Porto Editora / WOOK), copie aqui o endereço de uma capa, substituindo o ISBN por <code className="bg-slate-100 px-1 rounded">{"{isbn}"}</code>. O sistema passa a procurar aí primeiro. Se ficar vazio, usa apenas Google Books e Open Library. Nunca causa erros — se a capa ainda não existir, é simplesmente ignorada.
          </p>
        </div>
        <button onClick={save} className="bg-[#5A8F1E] hover:bg-[#3E6E11] text-white rounded px-5 py-2 text-sm" data-testid="settings-save-btn">Guardar definições</button>
      </div>

      <div className="bg-white border border-slate-200 rounded p-6 space-y-5 mt-6">
        <h2 className="font-display text-lg font-medium text-slate-900">SEO & Tracking</h2>
        <div>
          <label className="text-xs uppercase tracking-wider text-slate-500">URL do site (para sitemap.xml)</label>
          <input value={s.site_url || ""} onChange={(e)=>setS({...s, site_url: e.target.value})} placeholder="https://tendinhadosaber.pt" className="w-full mt-1 px-3 py-2 border border-slate-300 rounded font-mono text-sm" data-testid="settings-site-url"/>
        </div>
        <div>
          <label className="text-xs uppercase tracking-wider text-slate-500">Google Analytics 4 (Measurement ID)</label>
          <input value={s.google_analytics_id || ""} onChange={(e)=>setS({...s, google_analytics_id: e.target.value})} placeholder="G-XXXXXXXXXX" className="w-full mt-1 px-3 py-2 border border-slate-300 rounded font-mono text-sm" data-testid="settings-ga"/>
        </div>
        <div>
          <label className="text-xs uppercase tracking-wider text-slate-500">Google Ads (Conversion ID)</label>
          <input value={s.google_ads_id || ""} onChange={(e)=>setS({...s, google_ads_id: e.target.value})} placeholder="AW-XXXXXXXXX" className="w-full mt-1 px-3 py-2 border border-slate-300 rounded font-mono text-sm" data-testid="settings-ads"/>
        </div>
        <div>
          <label className="text-xs uppercase tracking-wider text-slate-500">Facebook Pixel ID</label>
          <input value={s.facebook_pixel_id || ""} onChange={(e)=>setS({...s, facebook_pixel_id: e.target.value})} placeholder="123456789012345" className="w-full mt-1 px-3 py-2 border border-slate-300 rounded font-mono text-sm" data-testid="settings-fb"/>
        </div>
        <div>
          <label className="text-xs uppercase tracking-wider text-slate-500">Google Search Console (código de verificação)</label>
          <input value={s.google_site_verification || ""} onChange={(e)=>setS({...s, google_site_verification: e.target.value})} placeholder="ABC123..." className="w-full mt-1 px-3 py-2 border border-slate-300 rounded font-mono text-sm" data-testid="settings-gsc"/>
          <p className="text-xs text-slate-500 mt-1">No Search Console, escolha "Tag HTML" e cole apenas o valor do <code>content</code>.</p>
        </div>
        <div className="bg-slate-50 rounded p-3 text-xs text-slate-600 space-y-1">
          <div>📄 Sitemap: <a href="/api/seo/sitemap.xml" target="_blank" rel="noreferrer" className="text-[#5A8F1E] hover:underline">/api/seo/sitemap.xml</a></div>
          <div>🤖 Robots: <a href="/robots.txt" target="_blank" rel="noreferrer" className="text-[#5A8F1E] hover:underline">/robots.txt</a></div>
        </div>
        <button onClick={save} className="bg-[#5A8F1E] hover:bg-[#3E6E11] text-white rounded px-5 py-2 text-sm" data-testid="settings-save-seo-btn">Guardar SEO</button>
      </div>

      <div className="bg-white border border-slate-200 rounded p-6 space-y-3 mt-6">
        <h2 className="font-display text-lg font-medium text-slate-900">Manutenção</h2>
        <p className="text-sm text-slate-600">Procura automaticamente capas de livros em falta no Google Books (por ISBN, depois por título+autor).</p>
        <button onClick={enrichCovers} className="bg-slate-900 hover:bg-black text-white rounded px-5 py-2 text-sm" data-testid="enrich-covers-btn">🖼️ Enriquecer capas em falta</button>
      </div>
    </div>
  );
}

export function AdminUsers() {
  const [users, setUsers] = useState([]);
  useEffect(() => { api.get("/admin/users").then((r) => setUsers(r.data)).catch(() => setUsers([])); }, []);
  return (
    <div className="p-8" data-testid="admin-users">
      <div className="mb-6">
        <div className="text-[10px] tracking-[0.2em] uppercase text-slate-500 font-semibold">Super-Admin</div>
        <h1 className="font-display text-3xl font-medium text-slate-900">Utilizadores</h1>
      </div>
      <div className="bg-white border border-slate-200 rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-[10px] uppercase tracking-wider text-slate-500 bg-slate-50">
            <tr><th className="text-left p-3">Email</th><th className="text-left p-3">Nome</th><th className="text-left p-3">Tipo</th><th className="text-left p-3">Criado</th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-slate-100">
                <td className="p-3">{u.email}</td>
                <td className="p-3">{u.name}</td>
                <td className="p-3"><Badge variant="outline" className="text-xs">{u.role}</Badge></td>
                <td className="p-3 text-xs text-slate-500">{u.created_at && new Date(u.created_at).toLocaleDateString("pt-PT")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
