import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BookCard } from "@/components/BookCard";
import { useCart } from "@/contexts/CartContext";
import SEO, { ORGANIZATION_JSONLD } from "@/components/SEO";
import { ArrowRight, GraduationCap, MapPin, School, BookOpen, ShieldCheck, Truck, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function HomePage() {
  const [grades, setGrades] = useState([]);
  const [munis, setMunis] = useState([]);
  const [schools, setSchools] = useState([]);
  const [grade, setGrade] = useState("");
  const [mun, setMun] = useState("");
  const [school, setSchool] = useState("");
  const [featured, setFeatured] = useState([]);
  const [partners, setPartners] = useState([]);
  const navigate = useNavigate();
  const { add } = useCart();

  useEffect(() => {
    api.get("/grade-levels").then((r) => setGrades(r.data));
    api.get("/municipalities").then((r) => setMunis(r.data));
    api.get("/books?limit=8").then((r) => setFeatured(r.data));
    api.get("/partners").then((r) => setPartners(r.data));
  }, []);

  useEffect(() => {
    if (mun) {
      const qs = new URLSearchParams({ municipality_id: mun });
      if (grade) qs.set("grade", grade);
      api.get(`/schools?${qs.toString()}`).then((r) => setSchools(r.data));
    } else setSchools([]);
    setSchool("");
  }, [mun, grade]);

  const searchSchool = () => {
    if (!school || !grade) {
      toast.error("Selecione ano e escola");
      return;
    }
    navigate(`/catalogo?school_id=${school}&grade=${encodeURIComponent(grade)}`);
  };

  const handleAdd = (book) => { add(book.isbn13); toast.success("Adicionado ao carrinho"); };

  return (
    <div data-testid="home-page">
      <SEO path="/" jsonLd={ORGANIZATION_JSONLD} />
      {/* HERO */}
      <section className="hero-aveiro relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 grid md:grid-cols-12 gap-10 items-center">
          <div className="md:col-span-7 text-white">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] uppercase tracking-[0.18em] mb-6">
              <Sparkles className="w-3.5 h-3.5" strokeWidth={1.5}/> Campanha Manuais 2026/27
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-medium leading-[1.05] mb-5">
              A casa dos <span className="font-serif italic text-[#D9F099]">manuais escolares</span><br/>
              em Aveiro.
            </h1>
            <p className="text-lg text-white/85 max-w-xl mb-8 leading-relaxed">
              Encontre todos os livros e cadernos de fichas da sua escola — plastificação opcional, entrega em mão na região de Aveiro.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/catalogo">
                <Button className="bg-[#E07A1F] hover:bg-[#B85F0E] text-white h-12 px-6 text-[15px]" data-testid="hero-catalog-btn">
                  Ver catálogo <ArrowRight className="w-4 h-4 ml-2" strokeWidth={1.5}/>
                </Button>
              </Link>
              <Link to="/vouchers">
                <Button variant="outline" className="bg-transparent border-white/40 text-white hover:bg-white hover:text-[#5A8F1E] h-12 px-6" data-testid="hero-vouchers-btn">
                  Submeter Voucher
                </Button>
              </Link>
            </div>
          </div>

          {/* CASCADING SELECTOR */}
          <div className="md:col-span-5">
            <div className="bg-white rounded-md shadow-2xl p-7 border border-white/10" data-testid="cascading-selector">
              <div className="text-[10px] tracking-[0.2em] uppercase text-[#4A5568] font-semibold mb-1">Encontre os seus manuais</div>
              <h2 className="font-display font-medium text-2xl text-[#1A202C] mb-5">Lista oficial da sua escola</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-[#4A5568] uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5" strokeWidth={1.5}/> Ano de escolaridade</label>
                  <Select value={grade} onValueChange={setGrade}>
                    <SelectTrigger className="h-11 bg-white" data-testid="grade-select"><SelectValue placeholder="Selecionar ano" /></SelectTrigger>
                    <SelectContent>
                      {grades.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-[#4A5568] uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" strokeWidth={1.5}/> Concelho</label>
                  <Select value={mun} onValueChange={setMun}>
                    <SelectTrigger className="h-11 bg-white" data-testid="municipality-select"><SelectValue placeholder="Selecionar concelho" /></SelectTrigger>
                    <SelectContent>
                      {munis.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-[#4A5568] uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><School className="w-3.5 h-3.5" strokeWidth={1.5}/> Escola</label>
                  <Select value={school} onValueChange={setSchool} disabled={!mun}>
                    <SelectTrigger className="h-11 bg-white" data-testid="school-select"><SelectValue placeholder={mun ? "Selecionar escola" : "Escolha primeiro o concelho"} /></SelectTrigger>
                    <SelectContent>
                      {schools.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={searchSchool} className="w-full h-11 bg-[#5A8F1E] hover:bg-[#3E6E11] text-white mt-2" data-testid="search-school-btn">
                  Ver lista de livros
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="border-y border-[#E2E8F0] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: BookOpen, t: "Manuais & Cadernos", s: "Todas as editoras certificadas" },
            { icon: Truck, t: "Entrega em Mão", s: "Aveiro e arredores" },
            { icon: ShieldCheck, t: "Plastificação", s: "+2€ por livro, à sua escolha" },
            { icon: Sparkles, t: "5% Parceiros", s: "Códigos das associações" },
          ].map(({ icon: Icon, t, s }, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-md bg-[#F5F8EC] grid place-items-center shrink-0">
                <Icon className="w-5 h-5 text-[#5A8F1E]" strokeWidth={1.5}/>
              </div>
              <div>
                <div className="font-display font-medium text-sm text-[#1A202C]">{t}</div>
                <div className="text-xs text-[#4A5568]">{s}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="text-[10px] tracking-[0.2em] uppercase text-[#4A5568] font-semibold mb-2">Em destaque</div>
            <h2 className="font-display text-3xl md:text-4xl font-medium text-[#1A202C]">Manuais mais procurados</h2>
          </div>
          <Link to="/catalogo" className="hidden md:flex items-center gap-1.5 text-sm text-[#5A8F1E] hover:underline" data-testid="see-all-link">
            Ver tudo <ArrowRight className="w-4 h-4" strokeWidth={1.5}/>
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {featured.map((b) => <BookCard key={b.isbn13} book={b} onAdd={handleAdd}/>)}
        </div>
      </section>

      {/* PARTNERS */}
      {partners.length > 0 && (
        <section className="bg-[#F5F8EC] py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <div className="text-[10px] tracking-[0.2em] uppercase text-[#4A5568] font-semibold mb-2">Parceiros locais</div>
              <h2 className="font-display text-3xl md:text-4xl font-medium text-[#1A202C]">5% de desconto exclusivo</h2>
              <p className="text-[#4A5568] mt-2 max-w-xl mx-auto">Use o código do seu clube ou associação no carrinho — desconto aplicado apenas aos cadernos de fichas.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              {partners.map((p) => (
                <div key={p.id} className="bg-white rounded-md p-6 border border-[#E2E8F0] flex flex-col items-center text-center" data-testid={`partner-${p.id}`}>
                  {p.logo_url && <img src={p.logo_url} alt={p.name} className="w-16 h-16 rounded-md object-cover mb-3" loading="lazy"/>}
                  <div className="font-display font-medium text-[#1A202C]">{p.name}</div>
                  <div className="text-xs text-[#4A5568] mt-1">{p.description}</div>
                </div>
              ))}
            </div>
            <p className="text-center text-xs text-[#4A5568] mt-6">Use o código exclusivo fornecido pelo seu parceiro no carrinho.</p>
          </div>
        </section>
      )}
    </div>
  );
}
