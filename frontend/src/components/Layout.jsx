import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { Search, ShoppingBag, User, Menu, Instagram, MapPin, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export function Header() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const submitSearch = (e) => {
    e.preventDefault();
    if (q.trim()) navigate(`/catalogo?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <header className="glass-header sticky top-0 z-50" data-testid="site-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-6">
          <Link to="/" className="flex items-center gap-2.5 shrink-0" data-testid="logo-link">
            <img src="/logo.svg" alt="Tendinha do Saber" className="w-11 h-11 object-contain" />
            <div className="leading-tight">
              <div className="font-display font-semibold text-[15px] text-[#1A202C]">Tendinha do Saber</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-[#4A5568]">Manuais Escolares · Aveiro</div>
            </div>
          </Link>

          <form onSubmit={submitSearch} className="hidden md:flex flex-1 max-w-xl" data-testid="search-form">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5568]" strokeWidth={1.5} />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Pesquisar por título, autor ou ISBN..."
                className="pl-10 pr-4 h-11 bg-white border-[#E2E8F0] focus-visible:ring-[#5A8F1E]"
                data-testid="search-input"
              />
            </div>
          </form>

          <nav className="hidden lg:flex items-center gap-1 text-sm">
            <NavLink to="/catalogo" className={({isActive}) => `px-3 py-2 rounded-md hover:bg-[#F5F8EC] ${isActive ? 'text-[#5A8F1E] font-medium' : 'text-[#1A202C]'}`} data-testid="nav-catalog">Catálogo</NavLink>
            <NavLink to="/parceiros" className={({isActive}) => `px-3 py-2 rounded-md hover:bg-[#F5F8EC] ${isActive ? 'text-[#5A8F1E] font-medium' : 'text-[#1A202C]'}`} data-testid="nav-partners">Parceiros</NavLink>
            <NavLink to="/vouchers" className={({isActive}) => `px-3 py-2 rounded-md hover:bg-[#F5F8EC] ${isActive ? 'text-[#5A8F1E] font-medium' : 'text-[#1A202C]'}`} data-testid="nav-vouchers">Vouchers</NavLink>
            <NavLink to="/contactos" className={({isActive}) => `px-3 py-2 rounded-md hover:bg-[#F5F8EC] ${isActive ? 'text-[#5A8F1E] font-medium' : 'text-[#1A202C]'}`} data-testid="nav-contacts">Contactos</NavLink>
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <div className="hidden md:flex items-center gap-2">
                {(user.role === "admin" || user.role === "super_admin") && (
                  <Link to="/admin" className="text-xs uppercase tracking-wider px-3 py-2 bg-[#1A202C] text-white rounded-md hover:bg-black" data-testid="admin-panel-link">Admin</Link>
                )}
                <Link to="/minha-conta" className="text-sm px-3 py-2 hover:bg-[#F5F8EC] rounded-md flex items-center gap-2" data-testid="account-link">
                  <User className="w-4 h-4" strokeWidth={1.5} /> {user.name?.split(" ")[0] || "Conta"}
                </Link>
                <Button variant="ghost" size="sm" onClick={logout} data-testid="logout-btn">Sair</Button>
              </div>
            ) : (
              <Link to="/login" className="hidden md:flex items-center gap-2 text-sm px-3 py-2 hover:bg-[#F5F8EC] rounded-md" data-testid="login-link">
                <User className="w-4 h-4" strokeWidth={1.5} /> Entrar
              </Link>
            )}
            <Link to="/carrinho" className="relative p-2 hover:bg-[#F5F8EC] rounded-md" data-testid="cart-link">
              <ShoppingBag className="w-5 h-5 text-[#1A202C]" strokeWidth={1.5} />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#E07A1F] text-white text-[10px] font-semibold rounded-full w-5 h-5 grid place-items-center" data-testid="cart-count">{count}</span>
              )}
            </Link>
            <button className="lg:hidden p-2" onClick={() => setOpen(!open)} data-testid="menu-toggle"><Menu className="w-5 h-5" strokeWidth={1.5} /></button>
          </div>
        </div>
        {open && (
          <div className="lg:hidden pb-4 flex flex-col gap-1 text-sm" data-testid="mobile-menu">
            <form onSubmit={submitSearch} className="mb-2">
              <Input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Pesquisar..." className="bg-white" data-testid="mobile-search-input"/>
            </form>
            <Link to="/catalogo" onClick={()=>setOpen(false)} className="py-2 px-2 rounded hover:bg-[#F5F8EC]">Catálogo</Link>
            <Link to="/parceiros" onClick={()=>setOpen(false)} className="py-2 px-2 rounded hover:bg-[#F5F8EC]">Parceiros</Link>
            <Link to="/vouchers" onClick={()=>setOpen(false)} className="py-2 px-2 rounded hover:bg-[#F5F8EC]">Vouchers</Link>
            <Link to="/contactos" onClick={()=>setOpen(false)} className="py-2 px-2 rounded hover:bg-[#F5F8EC]">Contactos</Link>
            {!user && <Link to="/login" onClick={()=>setOpen(false)} className="py-2 px-2 rounded hover:bg-[#F5F8EC]">Entrar</Link>}
            {user && <Link to="/minha-conta" onClick={()=>setOpen(false)} className="py-2 px-2 rounded hover:bg-[#F5F8EC]">A Minha Conta</Link>}
            {user && (user.role==="admin"||user.role==="super_admin") && <Link to="/admin" onClick={()=>setOpen(false)} className="py-2 px-2 rounded hover:bg-[#F5F8EC]">Painel Admin</Link>}
          </div>
        )}
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="bg-[#0F1F2E] text-[#E2E8F0] mt-24" data-testid="site-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-2.5 mb-4">
            <img src="/logo.svg" alt="Tendinha do Saber" className="w-11 h-11 object-contain bg-white rounded p-1" />
            <div>
              <div className="font-display font-semibold">Tendinha do Saber</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-[#A0AEC0]">Manuais · Aveiro</div>
            </div>
          </div>
          <p className="text-sm text-[#CBD5E0] leading-relaxed font-serif italic">
            "A casa dos manuais escolares — uma livraria local com a precisão das grandes."
          </p>
        </div>

        <div>
          <h4 className="text-[10px] tracking-[0.2em] uppercase text-[#A0AEC0] mb-4 font-semibold">Navegar</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/catalogo" className="hover:text-white">Catálogo</Link></li>
            <li><Link to="/parceiros" className="hover:text-white">Parceiros</Link></li>
            <li><Link to="/vouchers" className="hover:text-white">Vouchers MEGA</Link></li>
            <li><Link to="/como-funciona-voucher" className="hover:text-white">Como funciona o voucher</Link></li>
            <li><Link to="/seguir-encomenda" className="hover:text-white">Seguir encomenda</Link></li>
            <li><Link to="/sobre" className="hover:text-white">Sobre nós</Link></li>
            <li><Link to="/faq" className="hover:text-white">Perguntas frequentes</Link></li>
            <li><Link to="/contactos" className="hover:text-white">Contactos</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-[10px] tracking-[0.2em] uppercase text-[#A0AEC0] mb-4 font-semibold">Contactos</h4>
          <ul className="space-y-2.5 text-sm">
            <li className="flex items-start gap-2"><User className="w-4 h-4 mt-0.5 text-[#E07A1F]" strokeWidth={1.5}/> Francisco Tendinha</li>
            <li className="flex items-start gap-2"><Phone className="w-4 h-4 mt-0.5 text-[#E07A1F]" strokeWidth={1.5}/> +351 926 384 352</li>
            <li className="flex items-start gap-2"><Mail className="w-4 h-4 mt-0.5 text-[#E07A1F]" strokeWidth={1.5}/> tendinhadosaber@gmail.com</li>
            <li className="flex items-start gap-2"><MapPin className="w-4 h-4 mt-0.5 text-[#E07A1F]" strokeWidth={1.5}/> Aveiro, Portugal</li>
            <li className="flex items-center gap-3 pt-2">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-white" data-testid="instagram-link"><Instagram className="w-5 h-5" strokeWidth={1.5}/></a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-[10px] tracking-[0.2em] uppercase text-[#A0AEC0] mb-4 font-semibold">Legal</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/legal/privacidade" className="hover:text-white">Política de Privacidade</Link></li>
            <li><Link to="/legal/termos" className="hover:text-white">Termos & Condições</Link></li>
            <li><Link to="/legal/ral" className="hover:text-white">Resolução de Litígios (RAL)</Link></li>
            <li><a href="https://www.livroreclamacoes.pt" target="_blank" rel="noreferrer" className="hover:text-white">Livro de Reclamações</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[#1E2F44]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-[#A0AEC0]">
          <span>© {new Date().getFullYear()} Tendinha do Saber. Todos os direitos reservados.</span>
          <span>RNEC · NIF protegido · Cumprimento GDPR</span>
        </div>
      </div>
    </footer>
  );
}

export function SiteLayout({ children }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}
