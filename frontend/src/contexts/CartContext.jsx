import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "@/lib/api";

const CartCtx = createContext(null);
const STORAGE_KEY = "ts_cart_v1";

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch { return []; }
  });
  const [promoCode, setPromoCode] = useState(() => localStorage.getItem("ts_promo") || "");
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (promoCode) localStorage.setItem("ts_promo", promoCode);
    else localStorage.removeItem("ts_promo");
  }, [promoCode]);

  const recompute = useCallback(async () => {
    if (items.length === 0) { setSummary(null); return; }
    try {
      const { data } = await api.post("/cart/validate", { items, promo_code: promoCode || null });
      setSummary(data);
    } catch { setSummary(null); }
  }, [items, promoCode]);

  useEffect(() => { recompute(); }, [recompute]);

  const add = (isbn13, qty = 1) => {
    setItems((cur) => {
      const idx = cur.findIndex((x) => x.isbn13 === isbn13);
      if (idx >= 0) {
        const copy = [...cur];
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + qty };
        return copy;
      }
      return [...cur, { isbn13, qty, lamination: false }];
    });
  };

  const remove = (isbn13) => setItems((cur) => cur.filter((x) => x.isbn13 !== isbn13));
  const setQty = (isbn13, qty) => setItems((cur) =>
    cur.map((x) => x.isbn13 === isbn13 ? { ...x, qty: Math.max(1, qty) } : x)
  );
  const toggleLamination = (isbn13) => setItems((cur) =>
    cur.map((x) => x.isbn13 === isbn13 ? { ...x, lamination: !x.lamination } : x)
  );
  const clear = () => { setItems([]); setPromoCode(""); setSummary(null); };

  const count = items.reduce((s, x) => s + x.qty, 0);

  return (
    <CartCtx.Provider value={{ items, summary, promoCode, setPromoCode, add, remove, setQty, toggleLamination, clear, count, recompute }}>
      {children}
    </CartCtx.Provider>
  );
}

export const useCart = () => useContext(CartCtx);
