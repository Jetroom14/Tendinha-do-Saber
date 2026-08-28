import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { getBookKey } from "@/lib/bookKey";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BookCard } from "@/components/BookCard";
import { useCart } from "@/contexts/CartContext";
import SEO, { ORGANIZATION_JSONLD } from "@/components/SEO";
import { formatSchoolGrade } from "@/lib/utils";
import { ArrowRight, GraduationCap, MapPin, School, BookOpen, ShieldCheck, Truck, Sparkles, MessageCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export default function HomePage() {
  const [grades, setGrades] = useState([]);
  const [munis, setMunis] = useState([]);
  const [schools, setSchools] = useState([]);
  const [grade, setGrade] = useState("");
  const [mun, setMun] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [activeYear, setActiveYear] = useState(null);
  const [featured, setFeatured] = useState([]);
  const [featuredPage, setFeaturedPage] = useState(0);
  const [partners, setPartners] = useState([]);
  const [content, setContent] = useState(null);
  const navigate = useNavigate();
  const { add } = useCart();

  // Bloco 1 — a cascata de menus usa a coleção completa de escolas.
  useEffect(() => {
    api.get("/municipalities").then((r) => setMunis(r.data || [])).catch(() => setMunis([]));
    api.get("/adoptions/concelhos").then((r) => setActiveYear(r.data.active_year)).catch(() => setActiveYear(null));
    api.get("/books?limit=11").then((r) => setFeatured(r.data.items || []));
    api.get("/partners").then((r) => setPartners(r.data));
    api.get("/content").then((r) => setContent(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (mun) {
      api.get(`/schools?municipality_id=${encodeURIComponent(mun)}`)
        .then((r) => setSchools(Array.isArray(r.data) ? r.data : []))
        .catch(() => setSchools([]));
    } else setSchools([]);
    setSchoolId("");
    setGrades([]);
    setGrade("");
  }, [mun]);

  const selectedSchool = schools.find((s) => s.id === schoolId) || null;
  const selectedMunicipality = munis.find((m) => m.id === mun) || null;

  useEffect(() => {
    if (selectedSchool) setGrades(selectedSchool.grades_taught || []);
    else setGrades([]);
    setGrade("");
  }, [selectedSchool]);

  const searchSchool = () => {
    if (!mun || !schoolId || !grade || !selectedSchool || !selectedMunicipality) {
      toast.error("Escolha concelho, escola e ano");
      return;
    }
    navigate(`/adopcoes?concelho=${encodeURIComponent(selectedMunicipality.name)}&escola=${encodeURIComponent(selectedSchool.name)}&ano=${encodeURIComponent(grade)}&school_id=${encodeURIComponent(schoolId)}`);
  };

  const handleAdd = (book) => { add(book); toast.success("Adicionado ao carrinho"); };

  const featuredPages = [
    featured.slice(0, 4),
    featured.slice(4, 8),
    featured.slice(8, 11),
  ];

  const currentFeaturedBooks = featuredPages[featuredPage] || [];

  const changeFeaturedPage = (direction) => {
    setFeaturedPage((current) =>
      Math.max(0, Math.min(2, current + direction))
    );
  };

  return (
    <div data-testid="home-page">
      <SEO path="/" jsonLd={ORGANIZATION_JSONLD} />
      {/* HERO */}
      <section className="hero-new relative overflow-hidden"
        style={{
          backgroundImage: 'url("/branding/home-layout-reference.png")'
        }}
      >
        <img
          src="/branding/hero-books.svg"
          alt=""
          aria-hidden="true"
          className="hero-books-art hidden md:block"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20 lg:py-24 grid md:grid-cols-12 gap-8 lg:gap-10 items-center relative z-10">
          <div className="md:col-span-6 xl:col-span-5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/75 border border-[#CFE0BE] text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-[#315C35] font-semibold mb-5">
              <Sparkles className="w-3.5 h-3.5" strokeWidth={1.5}/>
              Campanha Manuais 2026/27
            </div>

            <h1 className="text-[2.55rem] sm:text-5xl lg:text-[3.45rem] xl:text-[3.8rem] font-display font-semibold leading-[1.04] tracking-[-0.035em] text-[#10263A] mb-5">
              Manuais escolares<br/>
              para um futuro com<br/>
              <span className="font-serif italic font-normal text-[#3E7C3D] tracking-[-0.02em]">
                mais oportunidades.
              </span>
            </h1>

            <p className="text-base sm:text-[17px] text-[#455467] max-w-[540px] mb-7 leading-relaxed">
              Encontre os manuais, cadernos de atividades e materiais de apoio da sua escola em Aveiro, de forma simples, rápida e segura.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/catalogo">
                <Button className="w-full sm:w-auto bg-[#E77817] hover:bg-[#C9620C] text-white h-12 px-7 text-[15px]" data-testid="hero-catalog-btn">
                  Ver catálogo
                  <ArrowRight className="w-4 h-4 ml-2" strokeWidth={1.5}/>
                </Button>
              </Link>

              <Link to="/vouchers">
                <Button variant="outline" className="w-full sm:w-auto bg-white/55 border-[#244559] text-[#173249] hover:bg-white h-12 px-7" data-testid="hero-vouchers-btn">
                  Submeter Voucher
                </Button>
              </Link>
            </div>
          </div>

          <div className="md:col-span-6 md:col-start-7 xl:col-span-4 xl:col-start-9">
            <div className="hero-selector-card p-5 sm:p-6 lg:p-7" data-testid="cascading-selector">
              <div className="text-[10px] tracking-[0.2em] uppercase text-[#315C35] font-semibold mb-1">
                Encontre os seus manuais
              </div>

              <h2 className="font-display font-semibold text-2xl text-[#10263A] mb-1">
                Lista oficial da sua escola
              </h2>

              {activeYear && (
                <div className="text-xs text-[#667387] mb-5">
                  Ano letivo {activeYear}
                </div>
              )}

              <div className="space-y-3.5">
                <div>
                  <label className="text-[11px] text-[#405367] uppercase tracking-wider mb-1.5 flex items-center gap-1.5 font-medium">
                    <MapPin className="w-3.5 h-3.5" strokeWidth={1.5}/> Concelho
                  </label>
                  <Select value={mun} onValueChange={setMun}>
                    <SelectTrigger className="h-11 bg-white/95" data-testid="municipality-select">
                      <SelectValue placeholder="Selecionar concelho" />
                    </SelectTrigger>
                    <SelectContent>
                      {munis.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-[11px] text-[#405367] uppercase tracking-wider mb-1.5 flex items-center gap-1.5 font-medium">
                    <School className="w-3.5 h-3.5" strokeWidth={1.5}/> Escola
                  </label>
                  <Select value={schoolId} onValueChange={setSchoolId} disabled={!mun}>
                    <SelectTrigger className="h-11 bg-white/95" data-testid="school-select">
                      <SelectValue placeholder={mun ? "Selecionar escola" : "Escolha primeiro o concelho"} />
                    </SelectTrigger>
                    <SelectContent>
                      {schools.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-[11px] text-[#405367] uppercase tracking-wider mb-1.5 flex items-center gap-1.5 font-medium">
                    <GraduationCap className="w-3.5 h-3.5" strokeWidth={1.5}/> Ano de escolaridade
                  </label>
                  <Select value={grade} onValueChange={setGrade} disabled={!schoolId}>
                    <SelectTrigger className="h-11 bg-white/95" data-testid="grade-select">
                      <SelectValue placeholder={schoolId ? "Selecionar ano" : "Escolha primeiro a escola"} />
                    </SelectTrigger>
                    <SelectContent>
                      {grades.map((g) => <SelectItem key={g} value={g}>{formatSchoolGrade(g)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={searchSchool}
                  disabled={!mun || !schoolId || !grade}
                  className="w-full h-11 bg-[#5A8F1E] hover:bg-[#3E6E11] text-white disabled:bg-[#CDD8CA]"
                  data-testid="search-school-btn"
                >
                  Ver lista de livros
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="border-y border-[#DEE8D5] bg-[#F7FAF3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-7">
          {[
            { icon: Truck, t: "Entrega em Mão", s: "Em Aveiro, Ílhavo e em todo o distrito" },
            { icon: ShieldCheck, t: "Compra segura", s: "Pagamentos processados com segurança" },
            { icon: BookOpen, t: "Manuais & Cadernos", s: "Todas as editoras certificadas" },
            { icon: Sparkles, t: "Parceiros", s: "Desconto exclusivo das associações" },
          ].map(({ icon: Icon, t, s }, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#DBE7D1] shadow-sm grid place-items-center shrink-0">
                <Icon className="w-5 h-5 text-[#397448]" strokeWidth={1.5}/>
              </div>
              <div>
                <div className="font-display font-semibold text-sm text-[#10263A]">{t}</div>
                <div className="text-xs text-[#667387] leading-relaxed mt-0.5">{s}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

{/* FEATURED */}
      <section
        className="home-featured-section max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        data-testid="home-featured"
      >
        <div className="flex items-end justify-between mb-7 md:mb-8">
          <div>
            <div className="text-[10px] tracking-[0.2em] uppercase text-[#4A5568] font-semibold mb-2">
              Em destaque
            </div>

            <h2 className="font-display text-3xl md:text-4xl font-medium text-[#1A202C]">
              Manuais mais procurados
            </h2>
          </div>

          <div className="hidden lg:flex items-center gap-2">
            <button
              type="button"
              onClick={() => changeFeaturedPage(-1)}
              disabled={featuredPage === 0}
              className="featured-nav-button"
              aria-label="Ver livros anteriores"
            >
              <ChevronLeft className="w-5 h-5" strokeWidth={1.5} />
            </button>

            <div className="featured-page-counter">
              {featuredPage + 1} / 3
            </div>

            <button
              type="button"
              onClick={() => changeFeaturedPage(1)}
              disabled={featuredPage === 2}
              className="featured-nav-button"
              aria-label="Ver mais livros"
            >
              <ChevronRight className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Desktop: 4 itens por página */}
        <div
          key={featuredPage}
          className="featured-desktop-grid hidden lg:grid grid-cols-4 gap-5"
        >
          {currentFeaturedBooks.map((book) => (
            <BookCard
              key={getBookKey(book)}
              book={book}
              onAdd={handleAdd}
            />
          ))}

          {featuredPage === 2 && (
            <Link
              to="/catalogo"
              className="featured-see-all-card group"
              data-testid="featured-see-all-card"
            >
              <div>
                <div className="featured-see-all-icon">
                  <ArrowRight className="w-6 h-6" strokeWidth={1.5} />
                </div>

                <div className="text-[10px] tracking-[0.2em] uppercase text-[#397448] font-semibold mt-6">
                  Catálogo
                </div>

                <h3 className="font-display text-2xl font-semibold text-[#10263A] mt-2">
                  Ver tudo
                </h3>

                <p className="text-sm text-[#667387] leading-relaxed mt-2">
                  Explore todos os manuais e cadernos disponíveis.
                </p>
              </div>

              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#D76E16]">
                Abrir catálogo
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          )}
        </div>

        {/* Mobile / tablet: swipe horizontal */}
        <div className="featured-mobile-track lg:hidden">
          {featured.map((book) => (
            <div
              key={getBookKey(book)}
              className="featured-mobile-item"
            >
              <BookCard
                book={book}
                onAdd={handleAdd}
              />
            </div>
          ))}

          <Link
            to="/catalogo"
            className="featured-mobile-see-all"
          >
            <ArrowRight className="w-6 h-6" strokeWidth={1.5} />

            <span className="font-display text-xl font-semibold">
              Ver todo o catálogo
            </span>
          </Link>
        </div>
      </section>

      {/* PARTNERS */}
      {partners.length > 0 && (
        <section
          className="home-partners-section"
          data-testid="home-partners"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center home-partners-heading">
              <div className="text-[10px] tracking-[0.2em] uppercase text-[#4A5568] font-semibold mb-2">
                Parceiros locais
              </div>

              <h2 className="font-display text-3xl md:text-4xl font-medium text-[#1A202C]">
                {content?.promotions_label || "Desconto exclusivo para parceiros"}
              </h2>

              <p className="text-[#4A5568] mt-2 max-w-2xl mx-auto leading-relaxed">
                Use o código do seu clube ou associação no carrinho — desconto
                aplicado apenas aos cadernos de fichas.
              </p>
            </div>

            <div className="home-partners-grid">
              {partners.map((partner) => {
                const name = String(partner?.name || "").toLowerCase();

                const isVista = name.includes("vista");
                const isBeira = name.includes("beira");

                const hero = isVista
                  ? "/partners/vista-alegre-card.png"
                  : isBeira
                    ? "/partners/beira-mar-card.png"
                    : null;

                const displayName = isVista
                  ? "Sporting Clube da Vista Alegre"
                  : isBeira
                    ? "Sport Clube Beira-Mar"
                    : partner.name;

                return (
                  <Link
                    key={partner.id}
                    to="/parceiros"
                    className="home-partner-link group"
                    data-testid={`partner-${partner.id}`}
                  >
                    {hero ? (
                      <div className="home-partner-hero">
                        <img
                          src={hero}
                          alt={displayName}
                          className="home-partner-hero-image"
                        />
                      </div>
                    ) : (
                      <div className="home-partner-fallback">
                        {displayName}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

{/* SERVICES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20" data-testid="home-services">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="text-[10px] tracking-[0.22em] uppercase text-[#397448] font-semibold mb-2">
            Tudo num só lugar
          </div>

          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-[-0.025em] text-[#10263A]">
            Tudo para os seus manuais, num só lugar
          </h2>

          <p className="text-[#667387] mt-3">
            Da lista oficial da escola à encomenda, simplificamos o início do ano letivo.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
          {[
            {
              icon: BookOpen,
              title: "Manuais escolares",
              description: "Encontre os livros adotados pela sua escola.",
              to: "/catalogo?type=Manual",
              cta: "Ver manuais"
            },
            {
              icon: GraduationCap,
              title: "Cadernos de atividades",
              description: "Os complementos certos para acompanhar cada disciplina.",
              to: "/catalogo?type=Workbook",
              cta: "Ver cadernos"
            },
            {
              icon: Sparkles,
              title: "Voucher MEGA",
              description: "Submeta o voucher diretamente através do site.",
              to: "/vouchers",
              cta: "Submeter voucher"
            },
            {
              icon: MessageCircle,
              title: "Precisa de ajuda?",
              description: "Tem dúvidas sobre manuais, vouchers ou encomendas? Fale connosco.",
              to: "/contactos",
              cta: "Contactar-nos"
            },
          ].map(({ icon: Icon, title, description, to, cta }) => (
            <Link key={title} to={to} className="home-service-card group">
              <div className="w-11 h-11 rounded-xl bg-[#EDF5E7] grid place-items-center mb-5 border border-[#DDE8D5]">
                <Icon className="w-5 h-5 text-[#397448]" strokeWidth={1.5}/>
              </div>

              <h3 className="font-display text-lg font-semibold text-[#10263A]">
                {title}
              </h3>

              <p className="text-sm text-[#667387] leading-relaxed mt-2 min-h-[44px]">
                {description}
              </p>

              <div className="text-sm text-[#D76E16] font-medium mt-5 flex items-center gap-1.5">
                {cta}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1"/>
              </div>
            </Link>
          ))}
        </div>
      </section>

</div>
  );
}
