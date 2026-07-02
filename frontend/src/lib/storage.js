const TOKEN_KEY = "ts_token";
const EMAIL_KEY = "remembered_email";

const canUseStorage = (storage) => {
  try {
    if (typeof window === "undefined") return false;
    const testKey = "__storage_test__";
    storage.setItem(testKey, "1");
    storage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

const canUseLocalStorage = () => canUseStorage(window.localStorage);
const canUseSessionStorage = () => canUseStorage(window.sessionStorage);

const getCookie = (name) => {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${encodeURIComponent(name)}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
};

const setCookie = (name, value, days) => {
  if (typeof document === "undefined") return;
  let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=/; SameSite=Lax`;
  if (typeof days === "number") {
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
    cookie += `; expires=${expires}`;
  }
  document.cookie = cookie;
};

const deleteCookie = (name) => {
  if (typeof document === "undefined") return;
  document.cookie = `${encodeURIComponent(name)}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
};

export const getAuthToken = () => {
  if (typeof window === "undefined") return null;
  try {
    if (canUseLocalStorage()) {
      const token = window.localStorage.getItem(TOKEN_KEY);
      if (token) return token;
    }
    if (canUseSessionStorage()) {
      const token = window.sessionStorage.getItem(TOKEN_KEY);
      if (token) return token;
    }
  } catch {
    // ignore
  }
  return getCookie(TOKEN_KEY);
};

export const setAuthToken = (token, keepSession) => {
  if (typeof window === "undefined") return;
  try {
    if (keepSession && canUseLocalStorage()) {
      window.localStorage.setItem(TOKEN_KEY, token);
      if (canUseSessionStorage()) window.sessionStorage.removeItem(TOKEN_KEY);
      deleteCookie(TOKEN_KEY);
      return;
    }
    if (!keepSession && canUseSessionStorage()) {
      window.sessionStorage.setItem(TOKEN_KEY, token);
      if (canUseLocalStorage()) window.localStorage.removeItem(TOKEN_KEY);
      deleteCookie(TOKEN_KEY);
      return;
    }
    if (keepSession) {
      setCookie(TOKEN_KEY, token, 30);
    } else {
      setCookie(TOKEN_KEY, token);
    }
  } catch {
    // ignore
  }
};

export const removeAuthToken = () => {
  if (typeof window === "undefined") return;
  try {
    if (canUseLocalStorage()) window.localStorage.removeItem(TOKEN_KEY);
    if (canUseSessionStorage()) window.sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
  deleteCookie(TOKEN_KEY);
};

export const getRememberedEmail = () => {
  if (typeof window === "undefined") return null;
  try {
    if (canUseLocalStorage()) {
      const email = window.localStorage.getItem(EMAIL_KEY);
      if (email) return email;
    }
  } catch {
    // ignore
  }
  return getCookie(EMAIL_KEY);
};

export const setRememberedEmail = (email) => {
  if (typeof window === "undefined") return;
  try {
    if (canUseLocalStorage()) {
      window.localStorage.setItem(EMAIL_KEY, email);
      deleteCookie(EMAIL_KEY);
      return;
    }
    setCookie(EMAIL_KEY, email, 30);
  } catch {
    // ignore
  }
};

export const removeRememberedEmail = () => {
  if (typeof window === "undefined") return;
  try {
    if (canUseLocalStorage()) window.localStorage.removeItem(EMAIL_KEY);
  } catch {
    // ignore
  }
  deleteCookie(EMAIL_KEY);
};
