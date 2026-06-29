import { useEffect, useState } from "react";
import api from "@/lib/api";
import SEO from "@/components/SEO";
import PartnerLogo from "@/components/PartnerLogo";

export default function PartnersPage() {
  const [partners, setPartners] = useState([]);
  const [content, setContent] = useState(null);
  useEffect(() => {
    api.get("/partners").then((r) => setPartners(r.data));
    api.get("/content").then((r) => setContent(r.data)).catch(() => {});
  }, []);
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16" data-testid="partners-page">
      <SEO title="Parceiros" path="/parceiros" description="Conheça os parceiros da Tendinha do Saber em Aveiro — clubes, associações e municípios que oferecem benefícios aos seus membros."/>
      <div className="text-[10px] tracking-[0.2em] uppercase text-[#4A5568] font-semibold mb-2">Parceiros</div>
      <h1 className="font-display text-3xl md:text-5xl font-medium mb-3">Os nossos parceiros</h1>
      <p className="text-[#4A5568] mb-12 max-w-2xl">
        Trabalhamos com clubes, associações de pais e municípios da região de Aveiro. Se é membro de um dos nossos parceiros, peça-lhes o <strong>código exclusivo</strong> para aplicar no carrinho.
      </p>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {partners.map((p) => (
          <div key={p.id} className="bg-white border border-[#E2E8F0] rounded-md overflow-hidden hover:border-[#5A8F1E] transition-colors h-full flex flex-col" data-testid={`partner-card-${p.id}`}>
            <div className="h-40 bg-[#F5F8EC] flex items-center justify-center p-6">
              <PartnerLogo partner={p} className="max-h-24 max-w-[80%] object-contain"/>
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <h3 className="font-display text-xl font-medium text-[#1A202C] mb-1">{p.name}</h3>
              <p className="text-sm text-[#4A5568]">{p.description}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-[#F5F8EC] border border-[#E2E8F0] rounded-md p-6 max-w-2xl mx-auto text-center">
        <p className="text-sm text-[#1A202C] leading-relaxed">
          <strong>{content?.partners_cta || "Tem interesse em tornar-se parceiro da Tendinha do Saber?"}</strong><br/>
          Contacte-nos em <a href="mailto:tendinhadosaber@gmail.com" className="text-[#5A8F1E] hover:underline">tendinhadosaber@gmail.com</a> para criarmos uma parceria.
        </p>
      </div>
    </div>
  );
}
