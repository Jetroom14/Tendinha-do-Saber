import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { formatApiErrorDetail } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Tag, Ticket, BarChart3, FileEdit, Plus, Trash2, Search,
  ShieldOff, ShieldCheck, TrendingUp, ExternalLink, Save,
} from "lucide-react";

const EYEBROW = "text-[10px] tracking-[0.2em] uppercase text-slate-500 font-semibold";
const H1 = "font-display text-3xl font-medium text-slate-900";
const CARD = "bg-white border border-slate-200 rounded";
const BTN = "bg-[#5A8F1E] hover:bg-[#3E6E11] text-white rounded text-sm";
const INPUT = "w-full mt-1 px-3 py-2 border border-slate-300 rounded text-sm";
const LABEL = "text-xs uppercase tracking-wider text-slate-500";

/* ============================ CATEGORIES ============================ */
export function AdminCategories() {
  const [cats, setCats] = useState([]);
  const [name, setName] = useState("");

  const load = async () => {
    const { data } = await api.get("/admin/categories");
    setCats(data);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!name.trim()) { toast.error("Indique um nome"); return; }
    try {
      await api.post("/admin/categories", { name: name.trim(), is_active: true });
      toast.success("Categoria criada"); setName(""); load();
    } catch (e) { toast.error(formatApiErrorDetail(e.response?.data?.detail)); }
  };
  const toggle = async (c) => {
    await api.put(`/admin/categories/${c.id}`, { name: c.name, is_active: !c.is_active });
    load();
  };
  const remove = async (id) => {
    if (!confirm("Eliminar categoria?")) return;
    await api.delete(`/admin/categories/${id}`); toast.success("Eliminada"); load();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8" data-testid="admin-categories">
      <div className="mb-6">
        <div className={EYEBROW}>Catálogo</div>
        <h1 className={H1}>Categorias</h1>
        <p className="text-sm text-slate-600 mt-2 max-w-2xl">Preparado para o futuro: além de manuais e cadernos, poderá organizar mochilas, calculadoras e outro material escolar por categoria.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        <div className={`lg:col-span-8 ${CARD} overflow-x-auto`}>
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase tracking-wider text-slate-500 bg-slate-50">
              <tr><th className="text-left p-3">Categoria</th><th className="text-center p-3">Estado</th><th className="p-3"></th></tr>
            </thead>
            <tbody>
              {cats.map((c) => (
                <tr key={c.id} className="border-t border-slate-100" data-testid={`category-row-${c.id}`}>
                  <td className="p-3 font-medium">{c.name}</td>
                  <td className="p-3 text-center">
                    <button onClick={() => toggle(c)} className="inline-flex" data-testid={`category-toggle-${c.id}`}>
                      <Badge variant="outline" className={`text-xs cursor-pointer ${c.is_active ? "text-emerald-700 border-emerald-300" : "text-slate-400"}`}>
                        {c.is_active ? "Ativa" : "Inativa"}
                      </Badge>
                    </button>
                  </td>
                  <td className="p-3 text-right">
                    <button onClick={() => remove(c.id)} className="text-slate-400 hover:text-rose-600 p-1" data-testid={`category-delete-${c.id}`}><Trash2 className="w-3.5 h-3.5"/></button>
                  </td>
                </tr>
              ))}
              {cats.length === 0 && <tr><td colSpan={3} className="p-10 text-center text-slate-500">Sem categorias. Crie a primeira ao lado.</td></tr>}
            </tbody>
          </table>
        </div>

        <div className={`lg:col-span-4 ${CARD} p-5`}>
          <h2 className="font-display text-lg font-medium mb-4 flex items-center gap-2"><Tag className="w-4 h-4 text-[#5A8F1E]"/> Nova categoria</h2>
          <div className="space-y-3">
            <div>
              <label className={LABEL}>Nome *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && create()} className={INPUT} placeholder="Ex: Mochilas" data-testid="category-form-name"/>
            </div>
            <button onClick={create} className={`w-full py-2 ${BTN}`} data-testid="category-create-btn"><Plus className="w-4 h-4 inline mr-1"/> Criar categoria</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================ CUSTOMERS ============================ */
export function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);

  const load = async () => {
    const qs = q ? `?q=${encodeURIComponent(q)}` : "";
    const { data } = await api.get(`/admin/customers${qs}`);
    setCustomers(data);
  };
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); /* eslint-disable-next-line */ }, [q]);

  const openDetail = async (c) => {
    setSelected(c.id); setDetail(null);
    const { data } = await api.get(`/admin/customers/${c.id}`);
    setDetail(data);
  };
  const toggleBlock = async (c) => {
    const fd = new FormData(); fd.append("blocked", String(!c.is_blocked));
    try {
      await api.put(`/admin/customers/${c.id}/block`, fd);
      toast.success(c.is_blocked ? "Cliente desbloqueado" : "Cliente bloqueado"); load();
      if (selected === c.id) openDetail(c);
    } catch (e) { toast.error(formatApiErrorDetail(e.response?.data?.detail)); }
  };
  const remove = async (c) => {
    if (!confirm(`Eliminar o cliente ${c.email}? Esta ação é permanente.`)) return;
    try {
      await api.delete(`/admin/customers/${c.id}`);
      toast.success("Cliente eliminado"); setSelected(null); setDetail(null); load();
    } catch (e) { toast.error(formatApiErrorDetail(e.response?.data?.detail)); }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8" data-testid="admin-customers">
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className={EYEBROW}>Clientes</div>
          <h1 className={H1}>Gestão de Clientes</h1>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" strokeWidth={1.5}/>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Procurar por nome ou email..." className="pl-9 pr-3 py-2 border border-slate-300 rounded text-sm w-72" data-testid="customer-search"/>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        <div className={`lg:col-span-7 ${CARD} overflow-x-auto`}>
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase tracking-wider text-slate-500 bg-slate-50">
              <tr><th className="text-left p-3">Nome</th><th className="text-left p-3">Email</th><th className="text-center p-3">Estado</th><th className="text-left p-3">Registo</th></tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} onClick={() => openDetail(c)} className={`border-t border-slate-100 cursor-pointer hover:bg-slate-50 ${selected === c.id ? "bg-[#F5F8EC]" : ""}`} data-testid={`customer-row-${c.id}`}>
                  <td className="p-3 font-medium">{c.name}</td>
                  <td className="p-3 text-slate-600">{c.email}</td>
                  <td className="p-3 text-center">
                    {c.is_blocked
                      ? <Badge variant="outline" className="text-xs text-rose-600 border-rose-300">Bloqueado</Badge>
                      : <Badge variant="outline" className="text-xs text-emerald-700 border-emerald-300">Ativo</Badge>}
                  </td>
                  <td className="p-3 text-xs text-slate-500">{c.created_at && new Date(c.created_at).toLocaleDateString("pt-PT")}</td>
                </tr>
              ))}
              {customers.length === 0 && <tr><td colSpan={4} className="p-10 text-center text-slate-500">Sem clientes registados.</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="lg:col-span-5">
          {!selected ? (
            <div className={`${CARD} p-8 text-center text-sm text-slate-500`}>Selecione um cliente para ver o histórico de encomendas e vouchers.</div>
          ) : !detail ? (
            <div className={`${CARD} p-8 text-center text-sm text-slate-400`}>A carregar...</div>
          ) : (
            <div className={`${CARD} p-6`} data-testid="customer-detail">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h2 className="font-display text-xl font-medium">{detail.customer.name}</h2>
                  <p className="text-sm text-slate-500">{detail.customer.email}</p>
                  {detail.customer.phone && <p className="text-sm text-slate-500">{detail.customer.phone}</p>}
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => toggleBlock(detail.customer)} className="p-2 rounded border border-slate-200 hover:bg-slate-50" title={detail.customer.is_blocked ? "Desbloquear" : "Bloquear"} data-testid="customer-block-btn">
                    {detail.customer.is_blocked ? <ShieldCheck className="w-4 h-4 text-emerald-600"/> : <ShieldOff className="w-4 h-4 text-amber-600"/>}
                  </button>
                  <button onClick={() => remove(detail.customer)} className="p-2 rounded border border-slate-200 hover:bg-rose-50" title="Eliminar" data-testid="customer-delete-btn">
                    <Trash2 className="w-4 h-4 text-rose-600"/>
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Encomendas ({detail.orders.length})</div>
                {detail.orders.length ? (
                  <div className="space-y-1.5 max-h-44 overflow-y-auto">
                    {detail.orders.map((o) => (
                      <div key={o.order_no} className="flex items-center justify-between text-sm bg-slate-50 rounded px-3 py-2">
                        <span className="font-mono text-xs">{o.order_no}</span>
                        <span>{o.totals?.total?.toFixed(2)}€</span>
                        <Badge variant="outline" className="text-[10px]">{o.status}</Badge>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-slate-400">Sem encomendas.</p>}
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Vouchers ({detail.vouchers.length})</div>
                {detail.vouchers.length ? (
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {detail.vouchers.map((v) => (
                      <div key={v.id} className="flex items-center justify-between text-sm bg-slate-50 rounded px-3 py-2">
                        <span className="font-mono text-xs">{v.code || "PDF"}</span>
                        <Badge variant="outline" className="text-[10px]">{v.status}</Badge>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-slate-400">Sem vouchers.</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================ PROMO CODES ============================ */
const BLANK_PROMO = { name: "", promo_code: "", discount_value: 5, logo_url: "", description: "", valid_from: "", valid_until: "", usage_limit: "", active: true };

export function AdminPromoCodes() {
  const [partners, setPartners] = useState([]);
  const [form, setForm] = useState(BLANK_PROMO);
  const [editing, setEditing] = useState(null);

  const load = async () => { const { data } = await api.get("/admin/partners"); setPartners(data); };
  useEffect(() => { load(); }, []);

  const buildPayload = () => ({
    name: form.name,
    promo_code: form.promo_code.toUpperCase(),
    discount_value: parseFloat(form.discount_value) || 0,
    logo_url: form.logo_url || "",
    description: form.description || "",
    valid_from: form.valid_from || null,
    valid_until: form.valid_until || null,
    usage_limit: form.usage_limit === "" ? null : parseInt(form.usage_limit, 10),
    active: form.active,
  });

  const submit = async () => {
    if (!form.name || !form.promo_code) { toast.error("Nome e código são obrigatórios"); return; }
    try {
      if (editing) {
        await api.put(`/admin/partners/${editing}`, buildPayload());
        toast.success("Código atualizado");
      } else {
        await api.post("/admin/partners", buildPayload());
        toast.success("Código criado");
      }
      setForm(BLANK_PROMO); setEditing(null); load();
    } catch (e) { toast.error(formatApiErrorDetail(e.response?.data?.detail)); }
  };
  const edit = (p) => {
    setEditing(p.id);
    setForm({
      name: p.name, promo_code: p.promo_code, discount_value: p.discount_value,
      logo_url: p.logo_url || "", description: p.description || "",
      valid_from: (p.valid_from || "").slice(0, 10), valid_until: (p.valid_until || "").slice(0, 10),
      usage_limit: p.usage_limit ?? "", active: p.active !== false,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const cancelEdit = () => { setForm(BLANK_PROMO); setEditing(null); };
  const remove = async (id) => {
    if (!confirm("Eliminar código?")) return;
    await api.delete(`/admin/partners/${id}`); toast.success("Eliminado"); if (editing === id) cancelEdit(); load();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8" data-testid="admin-promo-codes">
      <div className="mb-6">
        <div className={EYEBROW}>Promoções</div>
        <h1 className={H1}>Códigos Promocionais</h1>
        <p className="text-sm text-slate-600 mt-2 max-w-2xl">Cada código está associado a um parceiro e aplica desconto <strong>apenas aos cadernos de fichas</strong>. Defina validade e limite de utilizações sem mexer no código do site.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        <div className={`lg:col-span-8 ${CARD} overflow-x-auto`}>
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase tracking-wider text-slate-500 bg-slate-50">
              <tr>
                <th className="text-left p-3">Parceiro</th><th className="text-left p-3">Código</th>
                <th className="text-center p-3">Desc.</th><th className="text-center p-3">Usos</th>
                <th className="text-center p-3">Validade</th><th className="text-center p-3">Estado</th><th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {partners.map((p) => (
                <tr key={p.id} className="border-t border-slate-100" data-testid={`promo-row-${p.id}`}>
                  <td className="p-3 font-medium">{p.name}</td>
                  <td className="p-3 font-mono text-xs">{p.promo_code}</td>
                  <td className="p-3 text-center">−{p.discount_value}%</td>
                  <td className="p-3 text-center text-xs">{p.usage_count ?? 0}{p.usage_limit ? ` / ${p.usage_limit}` : ""}</td>
                  <td className="p-3 text-center text-xs text-slate-500">{p.valid_until ? new Date(p.valid_until).toLocaleDateString("pt-PT") : "—"}</td>
                  <td className="p-3 text-center">
                    {p.active !== false
                      ? <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-300">Ativo</Badge>
                      : <Badge variant="outline" className="text-[10px] text-slate-400">Inativo</Badge>}
                  </td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <button onClick={() => edit(p)} className="text-slate-400 hover:text-[#5A8F1E] p-1 mr-1" data-testid={`promo-edit-${p.id}`}><FileEdit className="w-3.5 h-3.5"/></button>
                    <button onClick={() => remove(p.id)} className="text-slate-400 hover:text-rose-600 p-1" data-testid={`promo-delete-${p.id}`}><Trash2 className="w-3.5 h-3.5"/></button>
                  </td>
                </tr>
              ))}
              {partners.length === 0 && <tr><td colSpan={7} className="p-10 text-center text-slate-500">Sem códigos promocionais.</td></tr>}
            </tbody>
          </table>
        </div>

        <div className={`lg:col-span-4 ${CARD} p-5`}>
          <h2 className="font-display text-lg font-medium mb-4 flex items-center gap-2">
            <Ticket className="w-4 h-4 text-[#5A8F1E]"/> {editing ? "Editar código" : "Novo código"}
          </h2>
          <div className="space-y-3">
            <div><label className={LABEL}>Nome do parceiro *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={INPUT} data-testid="promo-form-name"/></div>
            <div><label className={LABEL}>Código *</label><input value={form.promo_code} onChange={(e) => setForm({ ...form, promo_code: e.target.value.toUpperCase() })} className={`${INPUT} font-mono`} placeholder="EX: CLUBE5" data-testid="promo-form-code"/></div>
            <div><label className={LABEL}>Desconto (%)</label><input type="number" step="0.5" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} className={INPUT} data-testid="promo-form-discount"/></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={LABEL}>Início</label><input type="date" value={form.valid_from} onChange={(e) => setForm({ ...form, valid_from: e.target.value })} className={INPUT}/></div>
              <div><label className={LABEL}>Fim</label><input type="date" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} className={INPUT}/></div>
            </div>
            <div><label className={LABEL}>Limite de utilizações</label><input type="number" value={form.usage_limit} onChange={(e) => setForm({ ...form, usage_limit: e.target.value })} className={INPUT} placeholder="Vazio = ilimitado"/></div>
            <div><label className={LABEL}>Logótipo (URL)</label><input value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} className={INPUT}/></div>
            <div><label className={LABEL}>Descrição</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={INPUT} rows={2}/></div>
            <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })}/> Ativo</label>
            <div className="flex gap-2">
              <button onClick={submit} className={`flex-1 py-2 ${BTN}`} data-testid="promo-submit-btn">{editing ? "Guardar" : "Criar código"}</button>
              {editing && <button onClick={cancelEdit} className="px-3 py-2 text-sm border border-slate-300 rounded hover:bg-slate-50">Cancelar</button>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================ REPORTS ============================ */
export function AdminReports() {
  const [data, setData] = useState(null);
  const [days, setDays] = useState(365);

  useEffect(() => { api.get(`/admin/reports?days=${days}`).then((r) => setData(r.data)).catch(() => setData(null)); }, [days]);

  const months = data ? Object.entries(data.monthly_revenue || {}) : [];
  const maxMonth = months.reduce((m, [, v]) => Math.max(m, v), 0) || 1;

  return (
    <div className="p-4 sm:p-6 lg:p-8" data-testid="admin-reports">
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className={EYEBROW}>Análise</div>
          <h1 className={H1}>Relatórios de Vendas</h1>
        </div>
        <select value={days} onChange={(e) => setDays(parseInt(e.target.value, 10))} className="px-3 py-2 border border-slate-300 rounded text-sm" data-testid="reports-period">
          <option value={30}>Últimos 30 dias</option>
          <option value={90}>Últimos 90 dias</option>
          <option value={365}>Último ano</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className={`${CARD} p-5`}>
          <div className="text-[10px] uppercase tracking-wider text-slate-500">Receita (pagas)</div>
          <div className="font-display text-3xl font-medium text-slate-900 mt-1" data-testid="report-revenue">{(data?.revenue_total ?? 0).toFixed(2)}€</div>
        </div>
        <div className={`${CARD} p-5`}>
          <div className="text-[10px] uppercase tracking-wider text-slate-500">Encomendas pagas</div>
          <div className="font-display text-3xl font-medium text-slate-900 mt-1">{data?.paid_orders ?? 0}</div>
        </div>
        <div className={`${CARD} p-5`}>
          <div className="text-[10px] uppercase tracking-wider text-slate-500">Aguardam pagamento</div>
          <div className="font-display text-3xl font-medium text-amber-600 mt-1">{data?.pending_payment_orders ?? 0}</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        <div className={`lg:col-span-7 ${CARD} p-6`}>
          <div className="flex items-center gap-2 mb-5"><TrendingUp className="w-4 h-4 text-slate-500"/><h2 className="font-display text-lg font-medium">Receita mensal</h2></div>
          {months.length ? (
            <div className="space-y-2.5">
              {months.map(([month, val]) => (
                <div key={month} className="flex items-center gap-3" data-testid={`report-month-${month}`}>
                  <span className="text-xs text-slate-500 w-16 shrink-0">{month}</span>
                  <div className="flex-1 bg-slate-100 rounded h-6 overflow-hidden">
                    <div className="h-full bg-[#5A8F1E] rounded" style={{ width: `${(val / maxMonth) * 100}%` }}/>
                  </div>
                  <span className="text-xs font-medium w-20 text-right shrink-0">{val.toFixed(2)}€</span>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-slate-500">Sem receita registada no período.</p>}
        </div>

        <div className={`lg:col-span-5 ${CARD} p-6`}>
          <div className="flex items-center gap-2 mb-5"><BarChart3 className="w-4 h-4 text-slate-500"/><h2 className="font-display text-lg font-medium">Mais vendidos</h2></div>
          {data?.bestsellers?.length ? (
            <div className="space-y-2">
              {data.bestsellers.map((b, i) => (
                <div key={b.isbn13} className="flex items-center gap-3 text-sm" data-testid={`bestseller-${i}`}>
                  <span className="text-slate-400 font-mono text-xs w-5">{i + 1}.</span>
                  <span className="flex-1 truncate">{b.title}</span>
                  <span className="text-slate-500 text-xs whitespace-nowrap">{b.qty}×</span>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-slate-500">Sem vendas registadas.</p>}
        </div>
      </div>
    </div>
  );
}

/* ============================ CONTENT / CMS ============================ */
const CONTENT_FIELDS = [
  { key: "hero_subtitle", label: "Hero — Subtítulo", type: "textarea" },
  { key: "footer_text", label: "Rodapé — Frase", type: "textarea" },
  { key: "partners_cta", label: "Parceiros — Chamada", type: "text" },
  { key: "promotions_label", label: "Promoções — Título", type: "text" },
  { key: "instagram_handle", label: "Instagram — Handle", type: "text" },
  { key: "instagram_url", label: "Instagram — URL", type: "text" },
];

export function AdminContent() {
  const [content, setContent] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { api.get("/content").then((r) => setContent(r.data)); }, []);

  const save = async () => {
    setSaving(true);
    try {
      const payload = {};
      CONTENT_FIELDS.forEach((f) => { payload[f.key] = content[f.key] ?? ""; });
      const { data } = await api.put("/admin/content", payload);
      setContent(data); toast.success("Conteúdo atualizado");
    } catch (e) { toast.error(formatApiErrorDetail(e.response?.data?.detail)); }
    finally { setSaving(false); }
  };

  if (!content) return <div className="p-8 text-slate-500">A carregar...</div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl" data-testid="admin-content">
      <div className="mb-6">
        <div className={EYEBROW}>CMS</div>
        <h1 className={H1}>Conteúdo do Site</h1>
        <p className="text-sm text-slate-600 mt-2">Edite os textos do site sem tocar no código. As alterações aplicam-se imediatamente na homepage, rodapé e página de parceiros.</p>
      </div>

      <div className={`${CARD} p-6 space-y-5`}>
        {CONTENT_FIELDS.map((f) => (
          <div key={f.key}>
            <label className={LABEL}>{f.label}</label>
            {f.type === "textarea" ? (
              <textarea
                value={content[f.key] ?? ""}
                onChange={(e) => setContent({ ...content, [f.key]: e.target.value })}
                rows={f.rows || 2}
                className={INPUT}
                data-testid={`content-${f.key}`}
              />
            ) : (
              <input
                value={content[f.key] ?? ""}
                onChange={(e) => setContent({ ...content, [f.key]: e.target.value })}
                className={INPUT}
                data-testid={`content-${f.key}`}
              />
            )}
          </div>
        ))}
        <button onClick={save} disabled={saving} className={`px-5 py-2 ${BTN}`} data-testid="content-save-btn">
          <Save className="w-4 h-4 inline mr-1.5"/> {saving ? "A guardar..." : "Guardar alterações"}
        </button>
      </div>

      <div className="mt-4 text-xs text-slate-500 flex items-center gap-1.5">
        <ExternalLink className="w-3.5 h-3.5"/> A identidade visual e outras definições do website são geridas em <Link to="/admin/brand" className="text-[#5A8F1E] hover:underline">Website</Link>. As páginas legais têm uma área própria no menu.
      </div>
    </div>
  );
}
