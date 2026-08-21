import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useEffect } from "react";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Search, BookOpen, FileText, Upload, Truck, Shield, Sparkles, ArrowLeft, Phone, Mail } from "lucide-react";

export function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16" data-testid="about-page">
      <div className="text-[10px] tracking-[0.2em] uppercase text-[#4A5568] font-semibold mb-2">Sobre nós</div>
      <h1 className="font-display text-4xl md:text-5xl font-medium mb-6">A Tendinha do Saber</h1>
      <p className="font-serif italic text-xl text-[#1A202C] mb-10 leading-relaxed">
        "O catálogo completo de manuais de uma grande livraria, com o cuidado de quem conhece cada família pelo nome."
      </p>
      <div className="prose max-w-none space-y-5 text-[#1A202C] leading-relaxed">
        <p>Há mais de uma década que a Tendinha do Saber acompanha as famílias de Aveiro e arredores no início de cada ano letivo. Cresceu com a confiança dos pais, professores e alunos — e hoje continua dedicada à mesma missão: <strong>tornar simples a vida escolar das famílias</strong>.</p>
        <p>Trabalhamos diretamente com as principais editoras nacionais para garantir manuais e cadernos de fichas oficiais, ao preço de capa, com o serviço opcional de plastificação que dá outra vida aos livros — para que durem o ano inteiro e ainda sirvam o(a) irmã(o) seguinte.</p>
        <p>Acreditamos numa loja local, próxima e digital. Por isso construímos este espaço online, onde pode encontrar a lista completa da sua escola em poucos cliques, submeter o seu voucher MEGA, e escolher entre entrega em mão (Aveiro) ou envio por transportadora.</p>
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16" data-testid="voucher-guide-page">
      <div className="text-[10px] tracking-[0.2em] uppercase text-[#4A5568] font-semibold mb-2">Voucher MEGA</div>
      <h1 className="font-display text-4xl md:text-5xl font-medium mb-3">Como funciona em 3 passos</h1>
      <p className="text-[#4A5568] mb-12 max-w-2xl">Simplificámos ao máximo o processo de utilização do seu voucher MEGA.</p>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {[
          { n: "1", icon: Upload, t: "Submeta o voucher", s: "Insira o código manualmente ou envie um link para o PDF. Demora 30 segundos." },
          { n: "2", icon: Sparkles, t: "Validamos em 24h", s: "A nossa equipa confirma o voucher e atribui o desconto. Receberá um email de confirmação." },
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
          Após a validação, o desconto é refletido na sua encomenda. Todos os PDFs são armazenados de forma <strong>privada e segura</strong>, com eliminação automática 12 meses após a sua utilização (conforme RGPD).
        </p>
      </div>

      <Link to="/vouchers"><Button className="bg-[#E07A1F] hover:bg-[#B85F0E] text-white h-12 px-6">Submeter o meu voucher</Button></Link>
    </div>
  );
}

export function TrackOrderPage() {
  const [email, setEmail] = useState("");
  const [orderNo, setOrderNo] = useState("");
  const [order, setOrder] = useState(null);
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setOrder(null);
    try {
      const { data } = await api.get(`/orders/${orderNo}`);
      if (data.customer?.email?.toLowerCase() !== email.toLowerCase()) {
        setErr("Os dados não correspondem. Verifique o número e o email.");
      } else setOrder(data);
    } catch {
      setErr("Encomenda não encontrada.");
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
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16" data-testid="track-order-page">
      <div className="text-[10px] tracking-[0.2em] uppercase text-[#4A5568] font-semibold mb-2">Encomendas</div>
      <h1 className="font-display text-3xl md:text-4xl font-medium mb-3">Seguir a minha encomenda</h1>
      <p className="text-[#4A5568] mb-8">Consulte o estado da sua encomenda sem precisar de iniciar sessão.</p>

      <form onSubmit={submit} className="bg-white border border-[#E2E8F0] rounded-md p-6 space-y-4">
        <div>
          <label className="text-xs uppercase tracking-wider text-[#4A5568] mb-1.5 block">Número da encomenda</label>
          <Input value={orderNo} onChange={(e)=>setOrderNo(e.target.value)} placeholder="TS-XXXXXX..." required data-testid="track-orderno-input"/>
        </div>
        <div>
          <label className="text-xs uppercase tracking-wider text-[#4A5568] mb-1.5 block">Email usado na encomenda</label>
          <Input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required data-testid="track-email-input"/>
        </div>
        <Button type="submit" className="w-full bg-[#5A8F1E] hover:bg-[#3E6E11] text-white h-11" data-testid="track-submit-btn">
          <Search className="w-4 h-4 mr-2"/>Consultar
        </Button>
        {err && <p className="text-sm text-[#C53030]" data-testid="track-error">{err}</p>}
      </form>

      {order && (
        <div className="bg-white border border-[#E2E8F0] rounded-md p-6 mt-6" data-testid="track-result">
          <div className="grid grid-cols-2 gap-4 text-sm mb-5">
            <div><div className="text-[10px] uppercase tracking-wider text-[#4A5568]">Nº</div><div className="font-mono">{order.order_no}</div></div>
            <div><div className="text-[10px] uppercase tracking-wider text-[#4A5568]">Estado</div><div className="font-medium text-[#5A8F1E]">{STATUS_PT[order.status] || order.status}</div></div>
            <div><div className="text-[10px] uppercase tracking-wider text-[#4A5568]">Entrega</div><div>{order.delivery?.method === "hand_delivery" ? "Em mão" : "Levantamento"}</div></div>
            <div><div className="text-[10px] uppercase tracking-wider text-[#4A5568]">Total</div><div className="font-display text-xl">{order.totals?.total?.toFixed(2)}€</div></div>
          </div>
        </div>
      )}
    </div>
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
