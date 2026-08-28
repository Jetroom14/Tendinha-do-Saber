import { Link } from "react-router-dom";
import {
  ArrowRight,
  MapPin,
  MessageCircle,
  School,
} from "lucide-react";

export default function SupportJourney() {
  const items = [
    {
      icon: School,
      title: "Encontre sem complicações",
      description:
        "Selecione concelho, escola e ano de escolaridade para chegar rapidamente à lista certa.",
    },
    {
      icon: MessageCircle,
      title: "Ajuda quando precisa",
      description:
        "Tem dúvidas sobre manuais, vouchers ou uma encomenda? Estamos disponíveis para ajudar.",
    },
    {
      icon: MapPin,
      title: "Serviço próximo",
      description:
        "Estamos em Aveiro e entregamos em mão em Aveiro, Ílhavo e em todo o distrito.",
    },
  ];

  return (
    <section
      className="home-support-section support-journey-section"
      data-testid="support-journey"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="home-support-heading">
          <div>
            <div className="text-[10px] tracking-[0.22em] uppercase text-[#397448] font-semibold mb-2">
              Mais do que uma encomenda
            </div>

            <h2 className="font-display text-3xl md:text-4xl lg:text-[42px] font-semibold tracking-[-0.03em] text-[#10263A]">
              Apoiamos o seu percurso
            </h2>
          </div>

          <p className="text-[#667387] leading-relaxed max-w-xl">
            Queremos tornar a escolha dos manuais mais simples, desde a procura
            pela escola até à entrega e ao apoio depois da encomenda.
          </p>
        </div>

        <div className="home-support-grid">
          {items.map(({ icon: Icon, title, description }) => (
            <div key={title} className="home-support-card">
              <div className="home-support-icon">
                <Icon className="w-5 h-5" strokeWidth={1.5} />
              </div>

              <h3 className="font-display text-xl font-semibold text-[#10263A] mt-6">
                {title}
              </h3>

              <p className="text-sm text-[#667387] leading-relaxed mt-2">
                {description}
              </p>
            </div>
          ))}
        </div>

        <div className="home-support-contact">
          <span>Não encontrou o que procurava?</span>

          <Link
            to="/contactos"
            className="inline-flex items-center gap-1.5 font-semibold text-[#397448] hover:text-[#285E36]"
          >
            Fale connosco
            <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
          </Link>
        </div>
      </div>
    </section>
  );
}
