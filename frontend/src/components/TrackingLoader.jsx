import { useEffect } from "react";
import api from "@/lib/api";
import { getCookieConsent, getCookieConsentEvent } from "@/lib/cookieConsent";

let settingsCache = null;
let gaLoaded = false;
let adsLoaded = false;
let fbLoaded = false;
let gscMetaLoaded = false;
let activeConsent = { analytics: false, marketing: false };

const deleteCookie = (name) => {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  const base = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax${secure}`;
  document.cookie = base;
  document.cookie = `${base}; domain=${window.location.hostname}`;
};

const deleteCookiesByPrefixes = (prefixes) => {
  const cookies = document.cookie ? document.cookie.split(";") : [];
  for (const cookie of cookies) {
    const [rawName] = cookie.split("=");
    const name = decodeURIComponent((rawName || "").trim());
    if (prefixes.some((prefix) => name === prefix || name.startsWith(`${prefix}_`))) {
      deleteCookie(name);
    }
  }
};

const syncGaDisableFlags = (tracking, consent) => {
  if (tracking.google_analytics_id) {
    window[`ga-disable-${tracking.google_analytics_id}`] = !consent.analytics;
  }
  if (tracking.google_ads_id) {
    window[`ga-disable-${tracking.google_ads_id}`] = !consent.marketing;
  }
};

const isAllowedGtagDestination = (destination) => {
  if (!destination || !settingsCache) return true;
  if (destination === settingsCache.google_analytics_id) return activeConsent.analytics;
  if (destination === settingsCache.google_ads_id) return activeConsent.marketing;
  return true;
};

const ensureGtag = () => {
  if (typeof window.gtag === "function") return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    const args = Array.from(arguments);
    const [command, target, params] = args;

    if (command === "config" && !isAllowedGtagDestination(target)) {
      return;
    }

    if (command === "event" && params?.send_to) {
      const sendTo = Array.isArray(params.send_to) ? params.send_to : [params.send_to];
      const allowedTargets = sendTo.filter(isAllowedGtagDestination);
      if (allowedTargets.length === 0) {
        return;
      }
      args[2] = {
        ...params,
        send_to: Array.isArray(params.send_to) ? allowedTargets : allowedTargets[0],
      };
    }

    window.dataLayer.push(args);
  };
  window.gtag("js", new Date());
};

const ensureFacebookConsentGuard = () => {
  if (typeof window.fbq !== "function" || window.fbq.__tsConsentGuard) return;
  const originalFbq = window.fbq;
  const wrappedFbq = function fbqGuard() {
    const args = Array.from(arguments);
    if (args[0] === "consent") {
      return originalFbq.apply(window, args);
    }
    if (!activeConsent.marketing) {
      return undefined;
    }
    return originalFbq.apply(window, args);
  };
  Object.assign(wrappedFbq, originalFbq);
  wrappedFbq.__tsConsentGuard = true;
  wrappedFbq.__tsOriginal = originalFbq;
  window.fbq = wrappedFbq;
};

const updateConsentRuntime = (tracking, consent) => {
  activeConsent = {
    analytics: Boolean(consent?.analytics),
    marketing: Boolean(consent?.marketing),
  };

  syncGaDisableFlags(tracking, activeConsent);
  ensureGtag();
  window.gtag("consent", "update", {
    analytics_storage: activeConsent.analytics ? "granted" : "denied",
    ad_storage: activeConsent.marketing ? "granted" : "denied",
    ad_user_data: activeConsent.marketing ? "granted" : "denied",
    ad_personalization: activeConsent.marketing ? "granted" : "denied",
  });

  if (!activeConsent.analytics && tracking.google_analytics_id) {
    deleteCookiesByPrefixes(["_ga", "_gid", "_gat"]);
  }

  if (!activeConsent.marketing) {
    if (tracking.google_ads_id) {
      deleteCookiesByPrefixes(["_gcl", "_gac_gb"]);
    }
    if (tracking.facebook_pixel_id) {
      ensureFacebookConsentGuard();
      window.fbq?.("consent", "revoke");
      deleteCookiesByPrefixes(["_fbp", "_fbc"]);
    }
  }
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
  syncGaDisableFlags(tracking, activeConsent);
  window.gtag("config", tracking.google_analytics_id);
  gaLoaded = true;
};

const loadGoogleAds = (tracking) => {
  if (!tracking.google_ads_id || adsLoaded) return;
  loadScript(`https://www.googletagmanager.com/gtag/js?id=${tracking.google_ads_id}`);
  ensureGtag();
  syncGaDisableFlags(tracking, activeConsent);
  window.gtag("config", tracking.google_ads_id);
  adsLoaded = true;
};

const loadFacebookPixel = (tracking) => {
  if (!tracking.facebook_pixel_id || fbLoaded) return;
  const s = document.createElement("script");
  s.innerHTML = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init', '${tracking.facebook_pixel_id}');fbq('track', 'PageView');`;
  document.head.appendChild(s);
  ensureFacebookConsentGuard();
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
      updateConsentRuntime(tracking, consent);
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
