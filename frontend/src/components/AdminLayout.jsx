import { Outlet, NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import {
  LayoutDashboard, BookOpen, School2, FileText, ShoppingCart, Handshake,
  Users, Settings, ScrollText, LogOut, Upload, Home, Palette, Menu, X,
  Tag, UserCircle, Ticket, BarChart3, FileEdit, Key, Truck, Scale,
  GraduationCap, MessageCircleQuestion, Bell,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

// managerOnly → hidden from 'staff' (only admin / super_admin).
// superOnly → only super_admin.
const NAV = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard", end: true },

  // Operação diária — manter no topo para acesso rápido e
  // para os badges de novas entradas ficarem sempre visíveis.
  { to: "/admin/encomendas", icon: ShoppingCart, label: "Encomendas", notificationKey: "unseen_orders" },
  { to: "/admin/vouchers", icon: FileText, label: "Vouchers MEGA", notificationKey: "unseen_vouchers" },

  { to: "/admin/livros", icon: BookOpen, label: "Livros" },
  { to: "/admin/categorias", icon: Tag, label: "Categorias" },
  { to: "/admin/importar", icon: Upload, label: "Importações" },
  { to: "/admin/escolas", icon: School2, label: "Escolas", superOnly: true },
  { to: "/admin/adocoes", icon: GraduationCap, label: "Adoções DGE", managerOnly: true },
  { to: "/admin/clientes", icon: UserCircle, label: "Clientes", managerOnly: true },
  { to: "/admin/entregas", icon: Truck, label: "Custos de Entrega", managerOnly: true },
  { to: "/admin/codigos", icon: Ticket, label: "Códigos Promo", managerOnly: true },
  { to: "/admin/parceiros", icon: Handshake, label: "Parceiros", managerOnly: true },
  { to: "/admin/faq", icon: MessageCircleQuestion, label: "Perguntas Frequentes", managerOnly: true },
  { to: "/admin/conteudo", icon: FileEdit, label: "Conteúdo", superOnly: true },
  { to: "/admin/legal", icon: Scale, label: "Páginas Legais", managerOnly: true },
  { to: "/admin/brand", icon: Palette, label: "Website", superOnly: true },
  { to: "/admin/relatorios", icon: BarChart3, label: "Relatórios", managerOnly: true },
  { to: "/admin/logs", icon: ScrollText, label: "Atividade" },
  { to: "/admin/definicoes", icon: Settings, label: "Definições", superOnly: true },
  { to: "/admin/alterar-password", icon: Key, label: "Alterar Password" },
  { to: "/admin/utilizadores", icon: Users, label: "Utilizadores", superOnly: true },
];

const EMPTY_NOTIFICATIONS = {
  unseen_orders: 0,
  unseen_vouchers: 0,
  total: 0,
  items: [],
};

function visibleFor(role) {
  return NAV.filter((n) => {
    if (n.superOnly) return role === "super_admin";
    if (n.managerOnly) return role === "admin" || role === "super_admin";
    return true;
  });
}

function CountBadge({ count }) {
  if (!count) return null;

  return (
    <span
      className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-rose-500 text-white text-[10px] font-semibold grid place-items-center"
      aria-label={`${count} nova${count === 1 ? "" : "s"}`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

function relativeTime(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));

  if (seconds < 60) return "agora";
  if (seconds < 3600) return `há ${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `há ${Math.floor(seconds / 3600)} h`;

  const days = Math.floor(seconds / 86400);
  if (days === 1) return "ontem";
  if (days < 7) return `há ${days} dias`;

  return date.toLocaleDateString("pt-PT");
}

export default function AdminLayout() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState(EMPTY_NOTIFICATIONS);

  useEffect(() => {
    if (!loading && (!user || !["staff", "admin", "super_admin"].includes(user.role))) {
      navigate("/login?next=/admin");
    }
  }, [user, loading, navigate]);

  const loadNotifications = useCallback(async () => {
    if (!user || !["staff", "admin", "super_admin"].includes(user.role)) return;

    try {
      const { data } = await api.get("/admin/notifications");

      setNotifications({
        unseen_orders: Number(data?.unseen_orders || 0),
        unseen_vouchers: Number(data?.unseen_vouchers || 0),
        total: Number(data?.total || 0),
        items: Array.isArray(data?.items) ? data.items : [],
      });
    } catch {
      // As notificações são auxiliares:
      // uma falha temporária nunca deve bloquear o backoffice.
    }
  }, [user]);

  const markSeen = useCallback(async (kind) => {
    try {
      await api.post(`/admin/notifications/${kind}/mark-seen`);
      await loadNotifications();
    } catch {
      // Não bloquear a navegação do administrador por causa do badge.
    }
  }, [loadNotifications]);

  // Carregar imediatamente e depois atualizar de 30 em 30 segundos.
  useEffect(() => {
    if (loading || !user) return undefined;

    loadNotifications();

    const interval = window.setInterval(loadNotifications, 30000);

    return () => window.clearInterval(interval);
  }, [loading, user, loadNotifications]);

  // Entrar na respetiva área significa que o administrador viu
  // as notificações que existiam naquele momento.
  useEffect(() => {
    setNotificationsOpen(false);

    if (location.pathname.startsWith("/admin/encomendas")) {
      markSeen("orders");
    } else if (location.pathname.startsWith("/admin/vouchers")) {
      markSeen("vouchers");
    }
    // A intenção é correr apenas quando muda a rota.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  if (loading) {
    return (
      <div
        className="min-h-screen grid place-items-center text-slate-400"
        data-testid="admin-loading"
      >
        A carregar...
      </div>
    );
  }

  if (!user || !["staff", "admin", "super_admin"].includes(user.role)) return null;

  const closeMobile = () => setMobileOpen(false);

  const openNotification = async (item) => {
    const kind = item.type === "order" ? "orders" : "vouchers";

    setNotificationsOpen(false);

    // Marcamos este tipo como visto antes de navegar.
    await markSeen(kind);

    navigate(item.target);
  };

  const bellButton = (mobile = false) => (
    <button
      type="button"
      onClick={() => setNotificationsOpen((open) => !open)}
      className={
        mobile
          ? "relative ml-auto w-10 h-10 grid place-items-center rounded hover:bg-slate-800 transition-colors"
          : "relative w-10 h-10 grid place-items-center rounded-full bg-white border border-slate-200 shadow-sm text-slate-700 hover:border-[#5A8F1E] hover:text-[#5A8F1E] transition-colors"
      }
      aria-label="Notificações"
      data-testid={mobile ? "admin-notifications-mobile" : "admin-notifications-desktop"}
    >
      <Bell className="w-5 h-5" strokeWidth={1.7} />

      {notifications.total > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[19px] h-[19px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold grid place-items-center border-2 border-white">
          {notifications.total > 99 ? "99+" : notifications.total}
        </span>
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-body md:flex" data-testid="admin-layout">

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 bg-slate-900 text-white z-40 flex items-center px-4 h-14 shadow-md">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menu"
          className="p-2 -ml-2"
          data-testid="admin-mobile-menu-btn"
        >
          <Menu className="w-5 h-5" strokeWidth={1.5}/>
        </button>

        <Link to="/admin" className="ml-3 flex items-center gap-2">
          <img src="/logo.svg" alt="" className="w-7 h-7 bg-white rounded p-0.5"/>
          <span className="font-display font-semibold text-sm">Tendinha · Admin</span>
        </Link>

        {bellButton(true)}
      </div>

      {/* Bell desktop */}
      <div className="hidden md:block fixed top-4 right-4 z-50">
        {bellButton(false)}
      </div>

      {/* Painel de notificações */}
      {notificationsOpen && (
        <>
          <button
            type="button"
            aria-label="Fechar notificações"
            className="fixed inset-0 z-[55] bg-transparent"
            onClick={() => setNotificationsOpen(false)}
          />

          <div
            className="fixed right-4 top-16 md:top-16 z-[60] w-[calc(100vw-2rem)] max-w-sm bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden"
            data-testid="admin-notifications-panel"
          >
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <div className="font-display font-semibold text-slate-900">
                  Notificações
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {notifications.total
                    ? `${notifications.total} por ver`
                    : "Tudo visto"}
                </div>
              </div>

              <Bell className="w-4 h-4 text-slate-400" />
            </div>

            {notifications.items.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">
                  Sem notificações novas.
                </p>
              </div>
            ) : (
              <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-100">
                {notifications.items.map((item) => (
                  <button
                    type="button"
                    key={`${item.type}-${item.id}`}
                    onClick={() => openNotification(item)}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex gap-3"
                    data-testid={`admin-notification-${item.type}-${item.id}`}
                  >
                    <div
                      className={
                        item.type === "order"
                          ? "w-9 h-9 shrink-0 rounded-full bg-amber-50 text-amber-700 grid place-items-center"
                          : "w-9 h-9 shrink-0 rounded-full bg-violet-50 text-violet-700 grid place-items-center"
                      }
                    >
                      {item.type === "order"
                        ? <ShoppingCart className="w-4 h-4" />
                        : <FileText className="w-4 h-4" />
                      }
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-slate-900 truncate">
                        {item.title}
                      </div>

                      {item.subtitle && (
                        <div className="text-xs text-slate-500 truncate mt-0.5">
                          {item.subtitle}
                        </div>
                      )}

                      <div className="text-[10px] uppercase tracking-wider text-slate-400 mt-1.5">
                        {relativeTime(item.created_at)}
                      </div>
                    </div>

                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 mt-2" />
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setNotificationsOpen(false);
                  navigate("/admin/encomendas");
                }}
                className="px-3 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 border-r border-slate-100"
              >
                Ver encomendas
              </button>

              <button
                type="button"
                onClick={() => {
                  setNotificationsOpen(false);
                  navigate("/admin/vouchers");
                }}
                className="px-3 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Ver vouchers
              </button>
            </div>
          </div>
        </>
      )}

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={closeMobile}
          data-testid="admin-mobile-overlay"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 md:z-30 w-64 shrink-0 h-screen bg-slate-900 text-slate-100 flex flex-col transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
        data-testid="admin-sidebar"
      >
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <Link
            to="/admin"
            onClick={closeMobile}
            className="flex items-center gap-2.5"
          >
            <img
              src="/logo.svg"
              alt="Tendinha"
              className="w-9 h-9 object-contain bg-white rounded p-0.5"
            />

            <div>
              <div className="font-display font-semibold text-sm">
                Tendinha · Admin
              </div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400">
                v2.0
              </div>
            </div>
          </Link>

          <button
            onClick={closeMobile}
            className="md:hidden text-slate-400 hover:text-white"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5"/>
          </button>
        </div>

        <nav className="admin-sidebar-nav flex-1 p-3 space-y-0.5 overflow-y-auto">
          {visibleFor(user.role).map(({
            to,
            icon: Icon,
            label,
            end,
            notificationKey,
          }) => {
            const notificationCount = notificationKey
              ? Number(notifications[notificationKey] || 0)
              : 0;

            return (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={closeMobile}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-colors ${
                    isActive
                      ? "bg-[#5A8F1E] text-white font-medium"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`
                }
                data-testid={`admin-nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <Icon className="w-4 h-4 shrink-0" strokeWidth={1.5} />

                <span className="min-w-0 truncate">
                  {label}
                </span>

                <CountBadge count={notificationCount} />
              </NavLink>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-800 space-y-1">
          <Link
            to="/"
            onClick={closeMobile}
            className="flex items-center gap-3 px-3 py-2.5 rounded text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
            data-testid="admin-back-home"
          >
            <Home className="w-4 h-4" strokeWidth={1.5} />
            Ir para o site
          </Link>

          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
            data-testid="admin-logout"
          >
            <LogOut className="w-4 h-4" strokeWidth={1.5} />
            Terminar sessão
          </button>

          <div className="pt-3 px-1 text-[10px] uppercase tracking-wider text-slate-500 truncate">
            {user.email} · {user.role.replace("_", " ")}
          </div>
        </div>
      </aside>

      <main className="admin-main flex-1 min-w-0 max-w-full overflow-x-hidden pt-14 md:pt-0">
        <Outlet />
      </main>
    </div>
  );
}
