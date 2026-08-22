import { useEffect } from "react";
import api from "@/lib/api";
import { getCookieConsent, getCookieConsentEvent } from "@/lib/cookieConsent";

let settingsCache = null;
let gaLoaded = false;
let adsLoaded = false;
let fbLoaded = false;
let gscMetaLoaded = false;

const ensureGtag = () => {
  if (typeof window.gtag === "function") return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
};

const loadScript = (src) => {
  const existing = document.querySelector(`script[src="${src}"]`);
  if (existing) return;
  const script = document.createElement("script");
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
};

const loadAnalytics = (tracking) => {
  if (!tracking.google_analytics_id || gaLoaded) return;
  loadScript(`https://www.googletagmanager.com/gtag/js?id=${tracking.google_analytics_id}`);
  ensureGtag();
  window.gtag("config", tracking.google_analytics_id);
  gaLoaded = true;
};

const loadGoogleAds = (tracking) => {
  if (!tracking.google_ads_id || adsLoaded) return;
  loadScript(`https://www.googletagmanager.com/gtag/js?id=${tracking.google_ads_id}`);
  ensureGtag();
  window.gtag("config", tracking.google_ads_id);
  adsLoaded = true;
};

const loadFacebookPixel = (tracking) => {
  if (!tracking.facebook_pixel_id || fbLoaded) return;
  const s = document.createElement("script");
  s.innerHTML = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init', '${tracking.facebook_pixel_id}');fbq('track', 'PageView');`;
  document.head.appendChild(s);
  fbLoaded = true;
};

const loadSearchConsoleVerification = (tracking) => {
  if (!tracking.google_site_verification || gscMetaLoaded) return;
  const existing = document.querySelector('meta[name="google-site-verification"]');
  if (existing) {
    gscMetaLoaded = true;
    return;
  }
  const meta = document.createElement("meta");
  meta.name = "google-site-verification";
  meta.content = tracking.google_site_verification;
  document.head.appendChild(meta);
  gscMetaLoaded = true;
};

export default function TrackingLoader() {
  useEffect(() => {
    let cancelled = false;

    const applyTrackingConsent = (tracking) => {
      if (!tracking) return;
      loadSearchConsoleVerification(tracking);

      const consent = getCookieConsent();
      if (!consent) return;
      if (consent.analytics) loadAnalytics(tracking);
      if (consent.marketing) {
        loadGoogleAds(tracking);
        loadFacebookPixel(tracking);
      }
    };

    const onConsentChange = () => {
      applyTrackingConsent(settingsCache);
    };

    window.addEventListener(getCookieConsentEvent(), onConsentChange);
    window.addEventListener("storage", onConsentChange);

    const ensureSettings = async () => {
      if (settingsCache) {
        applyTrackingConsent(settingsCache);
        return;
      }
      try {
        const { data } = await api.get("/seo/tracking");
        if (cancelled) return;
        settingsCache = data || {};
        applyTrackingConsent(settingsCache);
      } catch {
        // ignore tracking failures
      }
    };

    ensureSettings();

    return () => {
      cancelled = true;
      window.removeEventListener(getCookieConsentEvent(), onConsentChange);
      window.removeEventListener("storage", onConsentChange);
    };
  }, []);
  return null;
}
