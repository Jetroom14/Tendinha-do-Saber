import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useEffect } from "react";
import api from "@/lib/api";
import SEO from "@/components/SEO";
import SupportJourney from "@/components/SupportJourney";
import { Input } from "@/components/ui/input";
import { Search, BookOpen, FileText, Upload, Truck, Shield, Sparkles, ArrowLeft, Phone, Mail } from "lucide-react";

export function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16" data-testid="about-page">
      <SEO
        title="Livraria em Aveiro e Ílhavo | Manuais Escolares"
        path="/sobre"
        description="Livraria de manuais escolares em Aveiro e Ílhavo. Encontre livros do 1.º ciclo, ensino básico e secundário, cadernos de atividades, vouchers MEGA e entrega no distrito de Aveiro."
      />

      <div className="text-[10px] tracking-[0.2em] uppercase text-[#4A5568] font-semibold mb-2">
        Sobre nós
      </div>

      <h1 className="font-display text-4xl md:text-5xl font-medium mb-6 leading-tight">
        Livraria de manuais escolares em Aveiro e Ílhavo
      </h1>

      <p className="font-serif italic text-xl text-[#1A202C] mb-10 leading-relaxed">
        Uma livraria local, próxima das famílias e preparada para tornar mais simples a compra dos livros de cada ano letivo.
      </p>

      <div className="space-y-10 text-[#1A202C] leading-relaxed">

        <section className="space-y-4">
          <p>
            A <strong>Tendinha do Saber</strong> é uma livraria dedicada a
            <strong> manuais escolares, livros escolares e cadernos de atividades no distrito de Aveiro</strong>.
            O nosso objetivo é facilitar a preparação do ano letivo, permitindo encontrar e encomendar
            os livros necessários de forma simples e com acompanhamento próximo.
          </p>

          <p>
            No nosso catálogo encontra manuais e cadernos para o
            <strong> ensino primário (1.º ciclo), 2.º ciclo, 3.º ciclo do ensino básico e ensino secundário</strong>,
            das principais editoras escolares nacionais.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-medium mb-4">
            Manuais escolares sem complicações
          </h2>

          <div className="space-y-4">
            <p>
              Pode procurar diretamente por título ou ISBN, ou selecionar o ano de escolaridade,
              concelho e escola para consultar os manuais associados. Assim, encontrar os
              <strong> livros escolares adotados</strong> torna-se muito mais rápido.
            </p>

            <p>
              Para além dos manuais escolares, disponibilizamos
              <strong> cadernos de atividades</strong>, serviço opcional de plastificação para os
              livros elegíveis e possibilidade de submissão de <strong>vouchers MEGA</strong>.
            </p>
          </div>
        </section>

        <section>
          <h2 className="font-display text-2xl font-medium mb-4">
            Entregas em Aveiro, Ílhavo e em todo o distrito
          </h2>

          <div className="space-y-4">
            <p>
              Fazemos <strong>entregas ao domicílio em todo o distrito de Aveiro</strong>,
              com o respetivo valor apresentado de acordo com o concelho de entrega.
            </p>

            <p>
              Temos uma ligação especialmente próxima a <strong>Aveiro e Ílhavo</strong>,
              o que nos permite assegurar um acompanhamento muito próximo e, sempre que a
              disponibilidade dos livros o permita, preparar entregas particularmente ágeis nesta zona.
            </p>
          </div>
        </section>

        <section>
          <h2 className="font-display text-2xl font-medium mb-4">
            Uma livraria local com a comodidade de comprar online
          </h2>

          <div className="space-y-4">
            <p>
              A Tendinha do Saber junta a proximidade de uma
              <strong> livraria em Aveiro</strong> à facilidade de uma loja online:
              pode escolher os livros, indicar a morada de entrega, selecionar os serviços pretendidos
              e concluir o pagamento diretamente no site.
            </p>

            <p>
              Queremos que comprar <strong>manuais escolares em Aveiro e Ílhavo</strong>
              seja um processo simples, claro e confortável — desde a procura dos livros até à entrega.
            </p>
          </div>
        </section>

        <div className="flex flex-wrap gap-3 pt-2">
          <Link to="/catalogo">
            <Button className="bg-[#5A8F1E] hover:bg-[#3E6E11] text-white">
              Ver catálogo de livros
            </Button>
          </Link>

          <Link to="/vouchers">
            <Button variant="outline">
              Submeter voucher MEGA
            </Button>
          </Link>
        </div>

      </div>
    </div>
  );
}

export function FaqPage() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/faq")
      .then((r) => setFaqs(r.data.items || []))
      .catch(() => setFaqs([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16" data-testid="faq-page">
      <div className="text-[10px] tracking-[0.2em] uppercase text-[#4A5568] font-semibold mb-2">Ajuda</div>
      <h1 className="font-display text-4xl md:text-5xl font-medium mb-10">Perguntas frequentes</h1>
      {loading ? (
        <p className="text-[#4A5568]">A carregar…</p>
      ) : faqs.length === 0 ? (
        <p className="text-[#4A5568] italic">Conteúdo em preparação.</p>
      ) : (
        <div className="space-y-5">
          {faqs.map((f, i) => (
          <details key={f.id || i} className="group bg-white border border-[#E2E8F0] rounded-md p-5" data-testid={`faq-${i}`}>
            <summary className="cursor-pointer font-display font-medium text-[#1A202C] flex items-center justify-between">
              {f.question}<span className="text-[#5A8F1E] group-open:rotate-45 transition-transform">+</span>
            </summary>
            <p className="mt-3 text-[#4A5568] leading-relaxed whitespace-pre-line">{f.answer}</p>
          </details>
          ))}
        </div>
      )}
    </div>
  );
}

export function VoucherGuidePage() {
  return (
    <>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16" data-testid="voucher-guide-page">
      <div className="text-[10px] tracking-[0.2em] uppercase text-[#4A5568] font-semibold mb-2">Voucher MEGA</div>
      <h1 className="font-display text-4xl md:text-5xl font-medium mb-3">Como funciona em 3 passos</h1>
      <p className="text-[#4A5568] mb-12 max-w-2xl">Simplificámos ao máximo o processo de utilização do seu voucher MEGA.</p>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {[
          { n: "1", icon: Upload, t: "Submeta o voucher", s: "Insira o código manualmente ou envie um link para o PDF. Demora 30 segundos." },
          { n: "2", icon: Sparkles, t: "Validamos em 24h", s: "A nossa equipa confirma o voucher e atribui o desconto. Entraremos em contacto após a validação." },
          { n: "3", icon: BookOpen, t: "Receba os manuais", s: "Receba os seus manuais em mão, na morada combinada. Plastificação opcional." },
        ].map((s, i) => (
          <div key={i} className="bg-white border border-[#E2E8F0] rounded-md p-7" data-testid={`voucher-step-${s.n}`}>
            <div className="text-6xl font-serif italic text-[#5A8F1E]/15 leading-none mb-2">{s.n}</div>
            <s.icon className="w-5 h-5 text-[#5A8F1E] mb-3" strokeWidth={1.5}/>
            <h3 className="font-display text-lg font-medium mb-2">{s.t}</h3>
            <p className="text-sm text-[#4A5568] leading-relaxed">{s.s}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#F5F8EC] border border-[#E2E8F0] rounded-md p-6 mb-8">
        <h2 className="font-display text-lg font-medium mb-3">Nota importante</h2>
        <p className="text-sm text-[#4A5568] leading-relaxed">
          Não existe integração oficial com a plataforma MEGA. A submissão aqui serve para a Tendinha registar o seu voucher e processar manualmente no portal oficial.
          Após a validação, o desconto é refletido na sua encomenda. Os PDFs são armazenados de forma <strong>privada e segura</strong> e seguem a política de retenção definida para este serviço.
        </p>
      </div>

      <Link to="/vouchers"><Button className="bg-[#E07A1F] hover:bg-[#B85F0E] text-white h-12 px-6">Submeter o meu voucher</Button></Link>
      </div>

      <SupportJourney />
    </>
  );
}

export function TrackOrderPage() {
  const [email, setEmail] = useState("");
  const [orderNo, setOrderNo] = useState("");
  const [order, setOrder] = useState(null);
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setOrder(null);

    try {
      const { data } = await api.post("/orders/track", {
        order_no: orderNo,
        email,
      });
      setOrder(data);
    } catch (err) {
      setErr(
        err?.response?.data?.detail ||
        "Não foi possível encontrar uma encomenda correspondente aos dados indicados."
      );
    }
  };

  const STATUS_PT = {
    pending_payment: "Aguarda Pagamento",
    paid: "Paga",
    preparing: "Em Preparação",
    ready: "Pronta",
    delivered: "Entregue",
    cancelled: "Cancelada",
  };

  return (
    <>
      <section
        className="track-final-page"
        data-testid="track-order-page"
      >
        <div className="track-final-hero">

          <div className="track-final-editorial">

            <div className="track-final-title-block">
              <div className="final-page-eyebrow">
                Encomendas
              </div>

              <h1>
                Seguir a minha
                <br />
                encomenda
              </h1>
            </div>

            <div className="track-final-intro-block">
              <p>
                Consulte o estado da sua encomenda sem precisar de iniciar sessão.
              </p>
            </div>

          </div>


          <div className="track-final-form-column">

            <div className="track-final-form-stack">
              <span
                className="track-form-layer layer-back"
                aria-hidden="true"
              />

              <span
                className="track-form-layer layer-middle"
                aria-hidden="true"
              />

              <form
                onSubmit={submit}
                className="track-final-form"
              >
                <div>
                  <label>Número da encomenda</label>

                  <Input
                    value={orderNo}
                    onChange={(e) => setOrderNo(e.target.value)}
                    placeholder="TS-XXXXXX..."
                    required
                    data-testid="track-orderno-input"
                  />
                </div>

                <div>
                  <label>Email usado na encomenda</label>

                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    data-testid="track-email-input"
                  />
                </div>

                <Button
                  type="submit"
                  className="track-final-submit"
                  data-testid="track-submit-btn"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Consultar
                </Button>

                {err && (
                  <p
                    className="track-final-error"
                    data-testid="track-error"
                  >
                    {err}
                  </p>
                )}
              </form>
            </div>

          </div>


          <div className="track-final-visual">
            <img
              src="/branding/heroes/hero-seguir-encomenda-final.png"
              alt="Acompanhar uma encomenda Tendinha do Saber"
            />
          </div>

        </div>

        {order && (
          <div className="track-final-result" data-testid="track-result">
            <div>
              <span>Nº</span>
              <strong className="font-mono">{order.order_no}</strong>
            </div>

            <div>
              <span>Estado</span>
              <strong className="text-[#5A8F1E]">
                {STATUS_PT[order.status] || order.status}
              </strong>
            </div>

            <div>
              <span>Entrega</span>
              <strong>
                {order.delivery?.method === "hand_delivery"
                  ? "Entrega ao domicílio"
                  : "Envio"}
              </strong>
            </div>

            <div>
              <span>Total</span>
              <strong>
                {order.totals?.total?.toFixed(2)}€
              </strong>
            </div>
          </div>
        )}
      </section>

      <div className="track-final-support">
        <SupportJourney />
      </div>
    </>
  );
}

export function NotFoundPage() {
  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center" data-testid="not-found-page">
      <div className="font-serif italic text-8xl text-[#5A8F1E]/20 mb-2">404</div>
      <h1 className="font-display text-3xl font-medium mb-3">Página não encontrada</h1>
      <p className="text-[#4A5568] mb-8">O link que abriu pode ter sido movido ou nunca existiu.</p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link to="/"><Button className="bg-[#5A8F1E] hover:bg-[#3E6E11] text-white"><ArrowLeft className="w-4 h-4 mr-2"/>Voltar ao início</Button></Link>
        <Link to="/catalogo"><Button variant="outline">Ver catálogo</Button></Link>
        <Link to="/contactos"><Button variant="outline">Contactar</Button></Link>
      </div>
    </div>
  );
}
