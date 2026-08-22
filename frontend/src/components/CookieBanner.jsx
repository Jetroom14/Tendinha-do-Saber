import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";
import {
  acceptAllCookieConsent,
  getCookieConsent,
  getCookieConsentEvent,
  hasCookieConsent,
  rejectOptionalCookieConsent,
  saveCookieConsent,
} from "@/lib/cookieConsent";

export function CookieBanner() {
  const [show, setShow] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const existing = getCookieConsent();
    if (existing) {
      setAnalytics(Boolean(existing.analytics));
      setMarketing(Boolean(existing.marketing));
      setShow(false);
    } else {
      setShow(true);
    }

    const openPreferences = () => {
      const latest = getCookieConsent();
      if (latest) {
        setAnalytics(Boolean(latest.analytics));
        setMarketing(Boolean(latest.marketing));
      }
      setShow(true);
      setPrefsOpen(true);
    };

    const onConsentChanged = () => {
      const latest = getCookieConsent();
      if (latest) {
        setAnalytics(Boolean(latest.analytics));
        setMarketing(Boolean(latest.marketing));
      }
    };

    window.addEventListener("ts:open-cookie-preferences", openPreferences);
    window.addEventListener(getCookieConsentEvent(), onConsentChanged);
    return () => {
      window.removeEventListener("ts:open-cookie-preferences", openPreferences);
      window.removeEventListener(getCookieConsentEvent(), onConsentChanged);
    };
  }, []);

  const acceptAll = () => {
    acceptAllCookieConsent();
    setShow(false);
    setPrefsOpen(false);
  };

  const rejectOptional = () => {
    rejectOptionalCookieConsent();
    setAnalytics(false);
    setMarketing(false);
    setShow(false);
    setPrefsOpen(false);
  };

  const savePreferences = () => {
    saveCookieConsent({ analytics, marketing });
    setShow(false);
    setPrefsOpen(false);
  };

  if (!show && !prefsOpen && hasCookieConsent()) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-[60] bg-white border border-[#E2E8F0] shadow-lg rounded-md p-5" data-testid="cookie-banner">
      <div className="flex items-start gap-3">
        <Cookie className="w-5 h-5 text-[#E07A1F] mt-0.5 shrink-0" strokeWidth={1.5} />
        <div className="flex-1">
          <p className="text-sm leading-relaxed text-[#1A202C]">
            Utilizamos cookies necessários ao funcionamento do site e, com a sua autorização, cookies de análise e marketing.
          </p>
          {prefsOpen && (
            <div className="mt-4 space-y-3 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] p-3">
              <label className="flex items-start justify-between gap-3 text-sm text-[#1A202C]">
                <span>
                  <strong>Necessários</strong>
                  <span className="block text-xs text-[#4A5568]">Sempre ativos para funcionalidades essenciais.</span>
                </span>
                <input type="checkbox" checked disabled className="mt-1" aria-label="Cookies necessários" />
              </label>
              <label className="flex items-start justify-between gap-3 text-sm text-[#1A202C]">
                <span>
                  <strong>Análise</strong>
                  <span className="block text-xs text-[#4A5568]">Medição anónima de utilização e desempenho.</span>
                </span>
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                  className="mt-1"
                  aria-label="Cookies de análise"
                />
              </label>
              <label className="flex items-start justify-between gap-3 text-sm text-[#1A202C]">
                <span>
                  <strong>Marketing</strong>
                  <span className="block text-xs text-[#4A5568]">Personalização e medição de campanhas.</span>
                </span>
                <input
                  type="checkbox"
                  checked={marketing}
                  onChange={(e) => setMarketing(e.target.checked)}
                  className="mt-1"
                  aria-label="Cookies de marketing"
                />
              </label>
            </div>
          )}
          <div className="flex flex-wrap gap-2 mt-3">
            <Button size="sm" className="bg-[#5A8F1E] hover:bg-[#3E6E11] text-white" onClick={acceptAll} data-testid="accept-cookies-btn">Aceitar tudo</Button>
            <Button size="sm" variant="outline" onClick={rejectOptional}>Rejeitar opcionais</Button>
            {!prefsOpen ? (
              <Button size="sm" variant="ghost" onClick={() => setPrefsOpen(true)}>Gerir preferências</Button>
            ) : (
              <Button size="sm" variant="outline" onClick={savePreferences}>Guardar preferências</Button>
            )}
            <a href="/legal/cookies" className="text-sm px-2 py-2 hover:underline text-[#4A5568]">Política de Cookies</a>
            <a href="/legal/privacidade" className="text-sm px-2 py-2 hover:underline text-[#4A5568]">Privacidade</a>
          </div>
        </div>
      </div>
    </div>
  );
}
