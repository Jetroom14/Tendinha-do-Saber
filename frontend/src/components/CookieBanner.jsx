import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";

export function CookieBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!localStorage.getItem("ts_cookie_consent")) setShow(true);
  }, []);
  const accept = () => { localStorage.setItem("ts_cookie_consent", "1"); setShow(false); };
  if (!show) return null;
  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-[60] bg-white border border-[#E2E8F0] shadow-lg rounded-md p-5" data-testid="cookie-banner">
      <div className="flex items-start gap-3">
        <Cookie className="w-5 h-5 text-[#E07A1F] mt-0.5 shrink-0" strokeWidth={1.5} />
        <div className="flex-1">
          <p className="text-sm leading-relaxed text-[#1A202C]">
            Utilizamos cookies essenciais ao funcionamento do site. Ao continuar, aceita a nossa Política de Privacidade.
          </p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" className="bg-[#5A8F1E] hover:bg-[#3E6E11] text-white" onClick={accept} data-testid="accept-cookies-btn">Aceitar</Button>
            <a href="/legal/privacidade" className="text-sm px-3 py-2 hover:underline text-[#4A5568]">Saber mais</a>
          </div>
        </div>
      </div>
    </div>
  );
}
