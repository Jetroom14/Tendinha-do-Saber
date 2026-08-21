import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "@/lib/api";

const CartCtx = createContext(null);
const STORAGE_KEY = "ts_cart_v1";
const BAGS_KEY = "ts_bags_qty";

function getItemKey(itemOrKey) {
  if (typeof itemOrKey === "string") return itemOrKey;
  return itemOrKey?.isbn13 || itemOrKey?.slug || itemOrKey?.pe_code || itemOrKey?.id || "";
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch { return []; }
  });
  const [bagsQty, setBagsQty] = useState(() => {
    const raw = parseInt(localStorage.getItem(BAGS_KEY) || "0", 10);
    return Number.isFinite(raw) && raw > 0 ? raw : 0;
  });
  const [promoCode, setPromoCode] = useState(() => localStorage.getItem("ts_promo") || "");
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem(BAGS_KEY, String(Math.max(0, bagsQty || 0)));
  }, [bagsQty]);

  useEffect(() => {
    if (promoCode) localStorage.setItem("ts_promo", promoCode);
    else localStorage.removeItem("ts_promo");
  }, [promoCode]);

  const recompute = useCallback(async () => {
    if (items.length === 0) { setSummary(null); return; }
    try {
      const { data } = await api.post("/cart/validate", { items, promo_code: promoCode || null, bags_qty: bagsQty });
      setSummary(data);
    } catch { setSummary(null); }
  }, [items, promoCode, bagsQty]);

  useEffect(() => { recompute(); }, [recompute]);

  const add = (bookOrKey, qty = 1) => {
    const itemKey = getItemKey(bookOrKey);
    if (!itemKey) return;
    setItems((cur) => {
      const idx = cur.findIndex((x) => x.isbn13 === itemKey);
      if (idx >= 0) {
        const copy = [...cur];
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + qty };
        return copy;
      }
      return [...cur, { isbn13: itemKey, qty, lamination: false }];
    });
  };

  const remove = (bookOrKey) => {
    const itemKey = getItemKey(bookOrKey);
    setItems((cur) => cur.filter((x) => x.isbn13 !== itemKey));
  };
  const setQty = (bookOrKey, qty) => {
    const itemKey = getItemKey(bookOrKey);
    setItems((cur) => cur.map((x) => x.isbn13 === itemKey ? { ...x, qty: Math.max(1, qty) } : x));
  };
  const toggleLamination = (bookOrKey) => {
    const itemKey = getItemKey(bookOrKey);
    setItems((cur) => cur.map((x) => x.isbn13 === itemKey ? { ...x, lamination: !x.lamination } : x));
  };
  const setBags = (qty) => setBagsQty(Math.max(0, parseInt(qty || 0, 10) || 0));
  const clear = () => { setItems([]); setPromoCode(""); setSummary(null); setBagsQty(0); };

  const count = items.reduce((s, x) => s + x.qty, 0);

  return (
    <CartCtx.Provider value={{ items, summary, promoCode, setPromoCode, add, remove, setQty, toggleLamination, clear, count, recompute, bagsQty, setBags }}>
      {children}
    </CartCtx.Provider>
  );
}

export const useCart = () => useContext(CartCtx);
