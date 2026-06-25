import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, School2, ShoppingCart, FileText, AlertTriangle, TrendingUp } from "lucide-react";

const Stat = ({ icon: Icon, label, value, tone = "slate" }) => (
  <div className="bg-white border border-slate-200 rounded p-5" data-testid={`stat-${label.toLowerCase().replace(/\s+/g, '-')}`}>
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded grid place-items-center bg-${tone}-100 text-${tone}-700`}>
        <Icon className="w-5 h-5" strokeWidth={1.5}/>
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
        <div className="font-display text-2xl font-medium text-slate-900">{value}</div>
      </div>
    </div>
  </div>
);

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get("/admin/dashboard").then((r) => setData(r.data)); }, []);

  return (
    <div className="p-8" data-testid="admin-dashboard">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="text-[10px] tracking-[0.2em] uppercase text-slate-500 font-semibold">Painel</div>
          <h1 className="font-display text-3xl font-medium text-slate-900">Dashboard</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Stat icon={BookOpen} label="Livros" value={data?.total_books ?? "—"} tone="emerald"/>
        <Stat icon={School2} label="Escolas" value={data?.total_schools ?? "—"} tone="blue"/>
        <Stat icon={ShoppingCart} label="Encomendas" value={data?.total_orders ?? "—"} tone="amber"/>
        <Stat icon={FileText} label="Vouchers pendentes" value={data?.pending_vouchers ?? "—"} tone="violet"/>
        <Stat icon={AlertTriangle} label="Anomalias" value={data?.anomalies ?? "—"} tone="rose"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded p-6">
          <div className="flex items-center gap-2 mb-4"><TrendingUp className="w-4 h-4 text-slate-500"/><h2 className="font-display text-lg font-medium">Encomendas recentes</h2></div>
          {data?.recent_orders?.length ? (
            <table className="w-full text-sm">
              <thead className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr><th className="text-left py-2">Nº</th><th className="text-left">Cliente</th><th className="text-left">Total</th><th className="text-left">Estado</th></tr>
              </thead>
              <tbody>
                {data.recent_orders.map((o) => (
                  <tr key={o.order_no} className="border-b border-slate-100 last:border-0">
                    <td className="py-2.5 font-mono text-xs">{o.order_no}</td>
                    <td>{o.customer?.name}</td>
                    <td>{o.totals?.total?.toFixed(2)}€</td>
                    <td><Badge variant="outline" className="text-xs">{o.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className="text-sm text-slate-500">Sem encomendas ainda.</p>}
        </div>

        <div className="bg-white border border-slate-200 rounded p-6">
          <h2 className="font-display text-lg font-medium mb-4">Atalhos rápidos</h2>
          <div className="space-y-2">
            <Link to="/admin/importar" className="block px-3 py-2 rounded text-sm hover:bg-slate-50 border border-slate-200">📥 Importar Excel</Link>
            <Link to="/admin/livros" className="block px-3 py-2 rounded text-sm hover:bg-slate-50 border border-slate-200">📚 Gerir livros</Link>
            <Link to="/admin/vouchers" className="block px-3 py-2 rounded text-sm hover:bg-slate-50 border border-slate-200">🎟️ Validar vouchers</Link>
            <Link to="/admin/parceiros" className="block px-3 py-2 rounded text-sm hover:bg-slate-50 border border-slate-200">🤝 Adicionar parceiro</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
