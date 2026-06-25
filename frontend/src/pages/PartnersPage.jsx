import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function PartnersPage() {
  const [partners, setPartners] = useState([]);
  useEffect(() => { api.get("/partners").then((r) => setPartners(r.data)); }, []);
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16" data-testid="partners-page">
      <div className="text-[10px] tracking-[0.2em] uppercase text-[#4A5568] font-semibold mb-2">Parceiros</div>
      <h1 className="font-display text-3xl md:text-5xl font-medium mb-3">Códigos de desconto</h1>
      <p className="text-[#4A5568] mb-12 max-w-2xl">
        Trabalhamos com clubes, associações de pais e municípios da região de Aveiro. Use o código do seu parceiro no carrinho —
        <strong> 5% de desconto</strong> aplicado a todos os cadernos de fichas.
      </p>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {partners.map((p) => (
          <div key={p.id} className="bg-white border border-[#E2E8F0] rounded-md overflow-hidden hover:border-[#5A8F1E] transition-colors" data-testid={`partner-card-${p.id}`}>
            {p.logo_url && <div className="aspect-[16/9] bg-[#F5F8EC]"><img src={p.logo_url} alt={p.name} className="w-full h-full object-cover"/></div>}
            <div className="p-6">
              <h3 className="font-display text-xl font-medium text-[#1A202C] mb-1">{p.name}</h3>
              <p className="text-sm text-[#4A5568] mb-4">{p.description}</p>
              <div className="flex items-center justify-between border-t border-[#E2E8F0] pt-4">
                <code className="font-mono text-sm bg-[#F5F8EC] px-3 py-1.5 rounded text-[#5A8F1E]">{p.promo_code}</code>
                <span className="text-[#E07A1F] font-semibold">−{p.discount_value}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
