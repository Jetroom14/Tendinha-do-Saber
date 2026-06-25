import { useParams } from "react-router-dom";

const PAGES = {
  privacidade: {
    title: "Política de Privacidade",
    body: `A Tendinha do Saber compromete-se com a proteção dos seus dados pessoais ao abrigo do Regulamento Geral de Proteção de Dados (RGPD).
Tratamos os seus dados (nome, contactos, morada, código postal) apenas para processar as suas encomendas, validar vouchers e contactá-lo
sobre o estado da sua compra. Não partilhamos os seus dados com terceiros sem o seu consentimento, exceto entidades estritamente necessárias
ao envio (transportadoras) e à faturação (sistemas de invoicing certificados pela AT).

Tem direito de acesso, retificação, apagamento e portabilidade dos seus dados. Para exercer estes direitos, contacte tendinhadosaber@gmail.com.`,
  },
  termos: {
    title: "Termos & Condições",
    body: `Ao utilizar este website concorda com as nossas condições gerais de venda. Os preços apresentados estão sujeitos a alterações sem aviso prévio.
A confirmação de qualquer encomenda fica sujeita a verificação de stock. Os vouchers serão analisados pela equipa e validados em até 24h úteis.
O serviço de plastificação (+2€ por livro) é prestado apenas em livros elegíveis (manuais; cadernos de fichas excluídos).`,
  },
  ral: {
    title: "Resolução Alternativa de Litígios (RAL)",
    body: `Em caso de litígio, o consumidor pode recorrer a uma Entidade de Resolução Alternativa de Litígios de Consumo:
CACCDC — Centro de Arbitragem de Conflitos de Consumo do Distrito de Coimbra · www.centrodearbitragemdecoimbra.com
Mais informações em www.consumidor.gov.pt.`,
  },
};

export default function LegalPage() {
  const { slug } = useParams();
  const page = PAGES[slug];
  if (!page) return <div className="max-w-3xl mx-auto px-4 py-20 text-center" data-testid="legal-not-found">Página não encontrada.</div>;
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16" data-testid={`legal-${slug}`}>
      <div className="text-[10px] tracking-[0.2em] uppercase text-[#4A5568] font-semibold mb-2">Legal</div>
      <h1 className="font-display text-3xl md:text-4xl font-medium mb-8">{page.title}</h1>
      <div className="prose max-w-none text-[#1A202C] leading-relaxed whitespace-pre-line">{page.body}</div>
    </div>
  );
}
