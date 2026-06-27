import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const STATUS_COLORS = {
  Pending: "bg-amber-100 text-amber-800",
  Validated: "bg-emerald-100 text-emerald-800",
  Used: "bg-blue-100 text-blue-800",
  Rejected: "bg-rose-100 text-rose-800",
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

export function AdminVouchers() {
  const [vouchers, setVouchers] = useState([]);
  const [filter, setFilter] = useState("all");

  const load = async () => {
    const qs = filter !== "all" ? `?status=${filter}` : "";
    const { data } = await api.get(`/admin/vouchers${qs}`);
    setVouchers(data);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  const updateStatus = async (id, status) => {
    const fd = new FormData(); fd.append("status", status);
    await api.put(`/admin/vouchers/${id}/status`, fd);
    toast.success(`Voucher atualizado para ${status}`); load();
  };

  return (
    <div className="p-8" data-testid="admin-vouchers">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-[10px] tracking-[0.2em] uppercase text-slate-500 font-semibold">Vouchers</div>
          <h1 className="font-display text-3xl font-medium text-slate-900">Vouchers MEGA</h1>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48" data-testid="voucher-filter"><SelectValue/></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="Pending">Pendentes</SelectItem>
            <SelectItem value="Validated">Validados</SelectItem>
            <SelectItem value="Used">Utilizados</SelectItem>
            <SelectItem value="Rejected">Rejeitados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white border border-slate-200 rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-[10px] uppercase tracking-wider text-slate-500 bg-slate-50">
            <tr><th className="text-left p-3">Data</th><th className="text-left p-3">Código</th><th className="text-left p-3">PDF</th><th className="text-left p-3">Notas</th><th className="text-left p-3">Estado</th><th className="text-right p-3">Ações</th></tr>
          </thead>
          <tbody>
            {vouchers.map((v) => (
              <tr key={v.id} className="border-t border-slate-100" data-testid={`voucher-row-${v.id}`}>
                <td className="p-3 text-xs">{new Date(v.created_at).toLocaleDateString("pt-PT")}</td>
                <td className="p-3 font-mono text-xs">{v.code || "—"}</td>
                <td className="p-3">
                  {v.pdf_storage_path ? (
                    <button onClick={() => openVoucherPdf(v.id)} className="text-[#5A8F1E] hover:underline text-xs" data-testid={`voucher-pdf-${v.id}`}>Ver PDF</button>
                  ) : v.pdf_url ? (
                    <a href={v.pdf_url} target="_blank" rel="noreferrer" className="text-[#5A8F1E] hover:underline text-xs">Link externo</a>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
                <td className="p-3 text-xs text-slate-600 max-w-xs truncate">{v.notes || "—"}</td>
                <td className="p-3"><span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded ${STATUS_COLORS[v.status]}`}>{v.status}</span></td>
                <td className="p-3 text-right">
                  <Select value={v.status} onValueChange={(s) => updateStatus(v.id, s)}>
                    <SelectTrigger className="h-8 w-32 inline-flex" data-testid={`voucher-status-${v.id}`}><SelectValue/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pendente</SelectItem>
                      <SelectItem value="Validated">Validar</SelectItem>
                      <SelectItem value="Used">Usado</SelectItem>
                      <SelectItem value="Rejected">Rejeitar</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
              </tr>
            ))}
            {vouchers.length === 0 && <tr><td colSpan={6} className="p-10 text-center text-slate-500">Sem vouchers.</td></tr>}
          </tbody>
        </table>
      </div>
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
    };
    const { data } = await api.put("/admin/settings", payload);
    setS(data); toast.success("Definições atualizadas");
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
