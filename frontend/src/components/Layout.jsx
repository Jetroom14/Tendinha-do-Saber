import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { Search, ShoppingBag, User, Menu, Instagram, MapPin, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import PartnerLogo from "@/components/PartnerLogo";

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
        <div className="flex items-center justify-between h-20 lg:h-[88px] gap-4 lg:gap-7">
          <Link to="/" className="flex items-center gap-3 shrink-0" data-testid="logo-link">
            <img src="/branding/logo-email.png" alt="Tendinha do Saber" className="w-11 h-11 lg:w-12 lg:h-12 object-contain" />
            <div className="leading-tight">
              <div className="font-display font-semibold text-[15px] text-[#1A202C]">Tendinha do Saber</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-[#4A5568]">Manuais Escolares · Aveiro</div>
            </div>
          </Link>

          <form onSubmit={submitSearch} className="hidden md:flex flex-1 max-w-[520px]" data-testid="search-form">
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

          <nav className="hidden lg:flex items-center gap-1.5 text-sm">
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
  const [partners, setPartners] = useState([]);
  const [content, setContent] = useState(null);
  useEffect(() => {
    api.get("/partners").then((r) => setPartners(r.data)).catch(() => {});
    api.get("/content").then((r) => setContent(r.data)).catch(() => {});
  }, []);
  return (
    <footer className="bg-[#0F1F2E] text-[#E2E8F0] mt-24" data-testid="site-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-2.5 mb-4">
            <img src="/branding/logo-email.png" alt="Tendinha do Saber" className="w-20 h-20 object-contain shrink-0" />
            <div>
              <div className="font-display font-semibold">Tendinha do Saber</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-[#A0AEC0]">Manuais · Aveiro</div>
            </div>
          </div>
          <p className="text-sm text-[#CBD5E0] leading-relaxed font-serif italic">
            "{content?.footer_text || "Mais do que uma livraria, um parceiro das famílias na escolha dos manuais escolares."}"
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
            <li></li>
          </ul>
        </div>

        <div>
          <h4 className="text-[10px] tracking-[0.2em] uppercase text-[#A0AEC0] mb-4 font-semibold">Contactos</h4>
          <ul className="space-y-2.5 text-sm">
            <li className="flex items-start gap-2"><User className="w-4 h-4 mt-0.5 text-[#E07A1F]" strokeWidth={1.5}/> Francisco Neves Tendinha</li>
            <li className="flex items-start gap-2"><Phone className="w-4 h-4 mt-0.5 text-[#E07A1F]" strokeWidth={1.5}/> <span>+351 961 194 491<span className="block text-xs text-[#A0AEC0]">Chamada para rede móvel nacional</span></span></li>
            <li className="flex items-start gap-2"><Mail className="w-4 h-4 mt-0.5 text-[#E07A1F]" strokeWidth={1.5}/> tendinhadosaber@gmail.com</li>
            <li className="flex items-start gap-2"><MapPin className="w-4 h-4 mt-0.5 text-[#E07A1F]" strokeWidth={1.5}/> Aveiro, Portugal</li>
            <li className="flex items-center gap-3 pt-2">
              <a href={content?.instagram_url || "https://instagram.com/tendinhadosaber"} target="_blank" rel="noreferrer" className="hover:text-white flex items-center gap-2" data-testid="instagram-link">
                <Instagram className="w-5 h-5" strokeWidth={1.5}/>
                <span className="text-sm">{content?.instagram_handle || "@tendinhadosaber"}</span>
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-[10px] tracking-[0.2em] uppercase text-[#A0AEC0] mb-4 font-semibold">Legal</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/legal/privacidade" className="hover:text-white">Política de Privacidade</Link></li>
            <li><Link to="/legal/termos" className="hover:text-white">Termos & Condições</Link></li>
            <li><Link to="/legal/cookies" className="hover:text-white">Política de Cookies</Link></li>
            <li>
              <button
                type="button"
                className="hover:text-white"
                onClick={() => window.dispatchEvent(new Event("ts:open-cookie-preferences"))}
              >
                Gerir preferências de cookies
              </button>
            </li>
            <li><Link to="/legal/ral" className="hover:text-white">Resolução de Litígios (RAL)</Link></li>
            <li><a href="https://www.livroreclamacoes.pt" target="_blank" rel="noreferrer" className="hover:text-white">Livro de Reclamações</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[#1E2F44]">
        {partners.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7" data-testid="footer-partners">
            <div className="text-[10px] tracking-[0.2em] uppercase text-[#A0AEC0] mb-4 text-center font-semibold">Em parceria com</div>
            <div className="flex flex-wrap items-center justify-center gap-6">
              {partners.map((p) => (
                <Link key={p.id} to="/parceiros" className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity" data-testid={`footer-partner-${p.id}`}>
                  <PartnerLogo partner={p} className="w-10 h-10 rounded object-cover bg-white/10"/>
                  <span className="text-xs text-[#CBD5E0] hidden sm:inline">{p.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="border-t border-[#1E2F44]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div>
            <div className="text-[10px] tracking-[0.2em] uppercase text-[#A0AEC0] font-semibold">
              Pagamentos seguros
            </div>

            <p className="text-xs text-[#A0AEC0] mt-1">
              Métodos de pagamento processados através da Ifthenpay.
            </p>
          </div>

          <div
            className="flex items-center flex-wrap gap-2.5"
            data-testid="footer-payment-methods"
          >
            {[
              ["Multibanco", "/branding/payments/multibanco.svg"],
              ["MB WAY", "/branding/payments/mbway.svg"],
              ["Payshop", "/branding/payments/payshop.png"],
            ].map(([label, src]) => (
              <div
                key={label}
                className="footer-payment-logo"
                title={label}
              >
                <img
                  src={src}
                  alt={label}
                  className="max-h-7 max-w-[84px] object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-[#1E2F44]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col lg:flex-row items-center justify-between gap-3 text-xs text-[#A0AEC0] footer-desktop-bottom">
          <span>
            © {new Date().getFullYear()} Tendinha do Saber. Todos os direitos reservados.
          </span>

          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center">
            <span>
              Aviso legal e informação comercial disponíveis nas páginas legais.
            </span>

            <span data-testid="site-credit">
              Website por{" "}
              <span className="text-[#E2E8F0] font-medium">
                Jetro Manuel
              </span>
            </span>
          </div>
        </div>
      </div>

        {/* MOBILE COMPACT FOOTER 2026 */}
        <div className="mobile-footer-compact">
          <div className="mobile-footer-brand">
            <img
              src="/branding/logo-email.png"
              alt="Tendinha do Saber"
            />
            <div>
              <strong>Tendinha do Saber</strong>
              <span>MANUAIS ESCOLARES · AVEIRO</span>
            </div>
          </div>

          <p className="mobile-footer-claim">
            “Mais do que uma livraria, um parceiro das famílias na escolha dos manuais escolares.”
          </p>

          <div className="mobile-footer-details">

            <details>
              <summary>Navegar</summary>
              <div className="mobile-footer-links">
                <Link to="/catalogo">Catálogo</Link>
                <Link to="/parceiros">Parceiros</Link>
                <Link to="/vouchers">Vouchers MEGA</Link>
                <Link to="/como-funciona-voucher">Como funciona o voucher</Link>
                <Link to="/seguir-encomenda">Seguir encomenda</Link>
                <Link to="/sobre">Sobre nós</Link>
                <Link to="/faq">Perguntas frequentes</Link>
              </div>
            </details>

            <details>
              <summary>Contactos</summary>
              <div className="mobile-footer-contact">
                <span>Francisco Neves Tendinha</span>

                <a href="tel:+351961194491">
                  +351 961 194 491
                </a>

                <small>Chamada para rede móvel nacional</small>

                <a href="mailto:tendinhadosaber@gmail.com">
                  tendinhadosaber@gmail.com
                </a>

                <span>Aveiro, Portugal</span>

                <a
                  className="footer-instagram-inline"
                  href="https://www.instagram.com/tendinhadosaber/"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram da Tendinha do Saber"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2.5" y="2.5" width="19" height="19" rx="5.5"></rect><path d="M16.5 11.37a4.5 4.5 0 1 1-8.99 1.26 4.5 4.5 0 0 1 8.99-1.26Z"></path><path d="M17.8 6.8h.01"></path></svg><span>@tendinhadosaber</span>
                </a>
              </div>
            </details>

            <details>
              <summary>Legal</summary>
              <div className="mobile-footer-links">
                <Link to="/politica-privacidade">
                  Política de Privacidade
                </Link>

                <Link to="/termos-condicoes">
                  Termos &amp; Condições
                </Link>

                <Link to="/politica-cookies">
                  Política de Cookies
                </Link>

                <button
                  type="button"
                  data-cc="show-preferencesModal"
                >
                  Gerir preferências de cookies
                </button>

                <Link to="/ral">
                  Resolução de Litígios (RAL)
                </Link>

                <a
                  href="https://www.livroreclamacoes.pt/Inicio/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Livro de Reclamações
                </a>
              </div>
            </details>

            <details>
              <summary>Em parceria com</summary>
              <div className="mobile-footer-partners">
                <Link to="/parceiros">
                  <span className="mobile-footer-partner bm">BM</span>
                  Academia do Beira-Mar
                </Link>

                <Link to="/parceiros">
                  <span className="mobile-footer-partner va">VA</span>
                  Academia Vista Alegre
                </Link>
              </div>
            </details>

            <details>
              <summary>Pagamentos seguros</summary>

              <div className="mobile-footer-payment-content">
                <p>
                  Métodos de pagamento processados através da Ifthenpay.
                </p>

                <div className="mobile-footer-payment-logos">
                  <span>
                    <img
                      src="/branding/payments/multibanco.svg"
                      alt="Multibanco"
                    />
                  </span>

                  <span>
                    <img
                      src="/branding/payments/mbway.svg"
                      alt="MB WAY"
                    />
                  </span>

                  <span>
                    <img
                      src="/branding/payments/payshop.png"
                      alt="Payshop"
                    />
                  </span>
                </div>
              </div>
            </details>
          </div>

          <div className="mobile-footer-bottom">
            <p>
              © 2026 Tendinha do Saber. Todos os direitos reservados.
            </p>

            <p>
              Aviso legal e informação comercial disponíveis nas páginas legais.
            </p>

            <p>
              Website por <strong>Jetro Manuel</strong>
            </p>
          </div>
        </div>

</footer>
  );
}

export function SiteLayout({ children }) {
  return (
    <>
      <Header />
      <main data-testid="site-main">{children}</main>
      <Footer />
    </>
  );
}
