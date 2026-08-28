import { useEffect, useState } from "react";
import api from "@/lib/api";
import SEO from "@/components/SEO";
import SupportJourney from "@/components/SupportJourney";
import PartnerLogo from "@/components/PartnerLogo";
import { Handshake, ArrowRight } from "lucide-react";

function getPartnerMeta(partner) {
  const name = String(partner?.name || "").toLowerCase();

  if (name.includes("vista")) {
    return {
      order: 0,
      tone: "blue",
      hero: "/partners/vista-alegre-card.png",
      title: "Sporting Clube da Vista Alegre",
      description:
        "O Sporting Clube da Vista Alegre desenvolve atividades de formação desportiva e educativa para jovens da região, incentivando hábitos saudáveis, espírito de equipa e crescimento pessoal.",
    };
  }

  if (name.includes("beira")) {
    return {
      order: 1,
      tone: "gold",
      hero: "/partners/beira-mar-card.png",
      title: "Sport Clube Beira-Mar",
      description:
        "O Sport Clube Beira-Mar é uma referência na formação desportiva da região de Aveiro, promovendo o desenvolvimento de jovens atletas através do desporto, da disciplina e dos valores de equipa.",
    };
  }

  return {
    order: 99,
    tone: "neutral",
    hero: null,
    title: partner?.name || "Parceiro",
    description: partner?.description || "",
  };
}

export default function PartnersPage() {
  const [partners, setPartners] = useState([]);
  const [content, setContent] = useState(null);

  useEffect(() => {
    api.get("/partners")
      .then((r) => setPartners(Array.isArray(r.data) ? r.data : []))
      .catch(() => setPartners([]));

    api.get("/content")
      .then((r) => setContent(r.data))
      .catch(() => {});
  }, []);

  const orderedPartners = [...partners].sort(
    (a, b) => getPartnerMeta(a).order - getPartnerMeta(b).order
  );

  return (
    <div className="partners-page" data-testid="partners-page">
      <SEO
        title="Parceiros"
        path="/parceiros"
        description="Conheça os parceiros da Tendinha do Saber em Aveiro e Ílhavo e os benefícios exclusivos disponíveis para os seus membros."
      />

      <section className="partners-visual-section">
        <img
          src="/branding/partners-bg.png"
          alt=""
          aria-hidden="true"
          className="partners-background-art"
        />

        <div className="partners-background-fade" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-14 md:py-20 lg:py-24">
          <header className="partners-intro">
            <div className="partners-eyebrow">
              <Handshake className="w-4 h-4" strokeWidth={1.5} />
              Parceiros
            </div>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold tracking-[-0.035em] text-[#10263A]">
              Os nossos parceiros
            </h1>

            <p className="text-[#526173] mt-4 max-w-2xl mx-auto leading-relaxed md:text-lg">
              Trabalhamos com clubes e associações da região para aproximar
              famílias, educação e comunidade.
            </p>

            <p className="text-[#526173] mt-2 max-w-2xl mx-auto leading-relaxed">
              Se é membro de um dos nossos parceiros, peça o seu{" "}
              <strong className="text-[#10263A]">código exclusivo</strong>{" "}
              para aplicar no carrinho.
            </p>
          </header>

          <div className="partners-cards">
            {orderedPartners.map((partner) => {
              const meta = getPartnerMeta(partner);

              return (
                <article
                  key={partner.id}
                  className={`partner-feature-card partner-tone-${meta.tone}`}
                  data-testid={`partner-card-${partner.id}`}
                >
                  {meta.hero ? (
                    <div className="partner-card-hero">
                      <img
                        src={meta.hero}
                        alt=""
                        aria-hidden="true"
                        className="partner-card-hero-image"
                      />
                    </div>
                  ) : (
                    <div className={`partner-logo-area partner-tone-${meta.tone}`}>
                      <div className={`partner-logo-badge partner-tone-${meta.tone}`}>
                        <PartnerLogo
                          partner={partner}
                          className="partner-logo-image"
                        />
                      </div>
                    </div>
                  )}

                  <div className={`partner-card-content partner-tone-${meta.tone}`}>
                    <div className="partner-accent-line" />

                    <div className="text-[10px] tracking-[0.18em] uppercase text-[#397448] font-semibold mb-3">
                      Parceiro Tendinha do Saber
                    </div>

                    <h2 className="font-display text-[30px] leading-tight md:text-[34px] font-semibold text-[#10263A]">
                      {meta.title}
                    </h2>

                    <p className="text-[15px] text-[#5B6979] leading-8 mt-4">
                      {meta.description}
                    </p>

                    <div className="partner-benefit">
                      Benefício exclusivo para associados
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="partners-cta">
            <div>
              <div className="text-[10px] tracking-[0.2em] uppercase text-[#397448] font-semibold mb-2">
                Fazer parte
              </div>

              <h2 className="font-display text-2xl md:text-3xl font-semibold text-[#10263A]">
                {content?.partners_cta ||
                  "Tem interesse em tornar-se parceiro da Tendinha do Saber?"}
              </h2>

              <p className="text-sm text-[#5B6979] mt-2 max-w-xl leading-relaxed">
                Contacte-nos para conhecermos a sua associação, clube ou
                organização e criarmos uma parceria adequada à sua comunidade.
              </p>
            </div>

            <a
              href="mailto:tendinhadosaber@gmail.com"
              className="partners-contact-button"
            >
              Falar connosco
              <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
            </a>
          </div>
        </div>
      </section>

      <SupportJourney />
    </div>
  );
}
