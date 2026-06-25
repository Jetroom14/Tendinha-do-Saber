import { Phone, Mail, MapPin, Instagram, Clock } from "lucide-react";

export default function ContactsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16" data-testid="contacts-page">
      <div className="text-[10px] tracking-[0.2em] uppercase text-[#4A5568] font-semibold mb-2">Contactos</div>
      <h1 className="font-display text-3xl md:text-5xl font-medium mb-3">Fale connosco</h1>
      <p className="text-[#4A5568] mb-12 max-w-2xl font-serif italic text-lg">Estamos aqui para ajudar com a sua lista escolar.</p>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border border-[#E2E8F0] rounded-md p-7 space-y-5">
          <h2 className="font-display text-xl font-medium">Tendinha do Saber</h2>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-3"><MapPin className="w-4 h-4 mt-0.5 text-[#5A8F1E]" strokeWidth={1.5}/> Aveiro, Portugal</li>
            <li className="flex items-start gap-3"><Phone className="w-4 h-4 mt-0.5 text-[#5A8F1E]" strokeWidth={1.5}/> <a href="tel:+351926384352" className="hover:text-[#5A8F1E]">+351 926 384 352</a></li>
            <li className="flex items-start gap-3"><Mail className="w-4 h-4 mt-0.5 text-[#5A8F1E]" strokeWidth={1.5}/> <a href="mailto:tendinhadosaber@gmail.com" className="hover:text-[#5A8F1E]">tendinhadosaber@gmail.com</a></li>
            <li className="flex items-start gap-3"><Instagram className="w-4 h-4 mt-0.5 text-[#5A8F1E]" strokeWidth={1.5}/> <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-[#5A8F1E]">@tendinhadosaber</a></li>
          </ul>
          <div className="border-t border-[#E2E8F0] pt-5">
            <div className="text-[10px] uppercase tracking-wider text-[#4A5568] font-semibold mb-2 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/> Horário</div>
            <p className="text-sm">Segunda a Sábado · 9h00 — 19h00</p>
            <p className="text-sm text-[#4A5568]">Encomendas online disponíveis 24h.</p>
          </div>
        </div>
        <div className="bg-[#5A8F1E] text-white rounded-md p-7 space-y-3">
          <h2 className="font-display text-xl font-medium">Responsável</h2>
          <p className="font-serif italic text-2xl">Francisco Tendinha</p>
          <p className="text-white/80 text-sm leading-relaxed">
            Há mais de uma década dedicado a equipar as escolas e famílias da região com os melhores manuais e materiais educativos.
          </p>
        </div>
      </div>
    </div>
  );
}
