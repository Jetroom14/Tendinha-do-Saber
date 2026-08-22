const COOKIE_CONSENT_KEY = "ts_cookie_consent_v1";
const COOKIE_CONSENT_EVENT = "ts:cookie-consent-updated";

const defaultConsent = () => ({
  version: 1,
  necessary: true,
  analytics: false,
  marketing: false,
  updatedAt: new Date().toISOString(),
});

const canUseLocalStorage = () => {
  try {
    if (typeof window === "undefined") return false;
    const testKey = "__cookie_consent_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

const normalizeConsent = (raw) => {
  if (!raw || typeof raw !== "object") return null;
  if (raw.version !== 1) return null;
  return {
    version: 1,
    necessary: true,
    analytics: Boolean(raw.analytics),
    marketing: Boolean(raw.marketing),
    updatedAt: raw.updatedAt || new Date().toISOString(),
  };
};

export const getCookieConsentKey = () => COOKIE_CONSENT_KEY;
export const getCookieConsentEvent = () => COOKIE_CONSENT_EVENT;

export const getCookieConsent = () => {
  if (typeof window === "undefined" || !canUseLocalStorage()) return null;
  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!raw) return null;
    return normalizeConsent(JSON.parse(raw));
  } catch {
    return null;
  }
};

export const hasCookieConsent = () => getCookieConsent() !== null;

export const saveCookieConsent = ({ analytics, marketing }) => {
  if (typeof window === "undefined" || !canUseLocalStorage()) return null;
  const consent = normalizeConsent({
    version: 1,
    necessary: true,
    analytics,
    marketing,
    updatedAt: new Date().toISOString(),
  });
  window.localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent));
  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_EVENT, { detail: consent }));
  return consent;
};

export const acceptAllCookieConsent = () => saveCookieConsent({ analytics: true, marketing: true });

export const rejectOptionalCookieConsent = () => saveCookieConsent({ analytics: false, marketing: false });
