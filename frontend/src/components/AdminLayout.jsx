import { Outlet, NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LayoutDashboard, BookOpen, School2, FileText, ShoppingCart, Handshake, Users, Settings, ScrollText, LogOut, Upload, Home, Palette, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

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
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || (user.role !== "admin" && user.role !== "super_admin"))) {
      navigate("/login?next=/admin");
    }
  }, [user, loading, navigate]);

  if (loading) return <div className="min-h-screen grid place-items-center text-slate-400" data-testid="admin-loading">A carregar...</div>;
  if (!user) return null;

  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="min-h-screen bg-slate-50 font-body" data-testid="admin-layout">
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 bg-slate-900 text-white z-40 flex items-center px-4 h-14 shadow-md">
        <button onClick={() => setMobileOpen(true)} aria-label="Abrir menu" className="p-2 -ml-2" data-testid="admin-mobile-menu-btn">
          <Menu className="w-5 h-5" strokeWidth={1.5}/>
        </button>
        <Link to="/admin" className="ml-3 flex items-center gap-2">
          <img src="/logo.svg" alt="" className="w-7 h-7 bg-white rounded p-0.5"/>
          <span className="font-display font-semibold text-sm">Tendinha · Admin</span>
        </Link>
      </div>

      {/* Overlay */}
      {mobileOpen && <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={closeMobile} data-testid="admin-mobile-overlay"/>}

      {/* Sidebar */}
      <aside className={`fixed md:sticky top-0 left-0 z-50 md:z-30 w-64 h-screen bg-slate-900 text-slate-100 flex flex-col transition-transform duration-200 ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`} data-testid="admin-sidebar">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <Link to="/admin" onClick={closeMobile} className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="Tendinha" className="w-9 h-9 object-contain bg-white rounded p-0.5"/>
            <div>
              <div className="font-display font-semibold text-sm">Tendinha · Admin</div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400">v2.0</div>
            </div>
          </Link>
          <button onClick={closeMobile} className="md:hidden text-slate-400 hover:text-white" aria-label="Fechar menu"><X className="w-5 h-5"/></button>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV.filter((n) => !n.superOnly || user.role === "super_admin").map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={closeMobile}
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
          <Link to="/" onClick={closeMobile} className="flex items-center gap-3 px-3 py-2.5 rounded text-sm text-slate-400 hover:bg-slate-800 hover:text-white" data-testid="admin-back-home">
            <Home className="w-4 h-4" strokeWidth={1.5} /> Ir para o site
          </Link>
          <button onClick={() => { logout(); navigate("/login"); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm text-slate-400 hover:bg-slate-800 hover:text-white" data-testid="admin-logout">
            <LogOut className="w-4 h-4" strokeWidth={1.5} /> Terminar sessão
          </button>
          <div className="pt-3 px-1 text-[10px] uppercase tracking-wider text-slate-500 truncate">
            {user.email} · {user.role.replace("_", " ")}
          </div>
        </div>
      </aside>

      <main className="md:ml-0 pt-14 md:pt-0 md:flex-1 min-w-0 md:pl-0">
        <div className="md:ml-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
