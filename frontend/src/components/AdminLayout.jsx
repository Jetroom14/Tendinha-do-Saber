import { Outlet, NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LayoutDashboard, BookOpen, School2, FileText, ShoppingCart, Handshake, Users, Settings, ScrollText, LogOut, Upload, Home, Palette } from "lucide-react";
import { useEffect } from "react";

const NAV = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/admin/livros", icon: BookOpen, label: "Livros" },
  { to: "/admin/importar", icon: Upload, label: "Importar Excel" },
  { to: "/admin/escolas", icon: School2, label: "Escolas" },
  { to: "/admin/encomendas", icon: ShoppingCart, label: "Encomendas" },
  { to: "/admin/vouchers", icon: FileText, label: "Vouchers MEGA" },
  { to: "/admin/parceiros", icon: Handshake, label: "Parceiros" },
  { to: "/admin/brand", icon: Palette, label: "Identidade Visual" },
  { to: "/admin/logs", icon: ScrollText, label: "Atividade" },
  { to: "/admin/definicoes", icon: Settings, label: "Definições" },
  { to: "/admin/utilizadores", icon: Users, label: "Utilizadores", superOnly: true },
];

export default function AdminLayout() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || (user.role !== "admin" && user.role !== "super_admin"))) {
      navigate("/login?next=/admin");
    }
  }, [user, loading, navigate]);

  if (loading) return <div className="min-h-screen grid place-items-center text-slate-400" data-testid="admin-loading">A carregar...</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex font-body" data-testid="admin-layout">
      <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-slate-800">
          <Link to="/admin" className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="Tendinha" className="w-9 h-9 object-contain bg-white rounded p-0.5"/>
            <div>
              <div className="font-display font-semibold text-sm">Tendinha · Admin</div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400">v2.0</div>
            </div>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV.filter((n) => !n.superOnly || user.role === "super_admin").map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-colors ${isActive ? "bg-[#5A8F1E] text-white font-medium" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`
              }
              data-testid={`admin-nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <Icon className="w-4 h-4" strokeWidth={1.5} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-800 space-y-1">
          <Link to="/" className="flex items-center gap-3 px-3 py-2.5 rounded text-sm text-slate-400 hover:bg-slate-800 hover:text-white" data-testid="admin-back-home">
            <Home className="w-4 h-4" strokeWidth={1.5} /> Ir para o site
          </Link>
          <button onClick={() => { logout(); navigate("/login"); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm text-slate-400 hover:bg-slate-800 hover:text-white" data-testid="admin-logout">
            <LogOut className="w-4 h-4" strokeWidth={1.5} /> Terminar sessão
          </button>
          <div className="pt-3 px-1 text-[10px] uppercase tracking-wider text-slate-500">
            {user.email} · {user.role.replace("_", " ")}
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
