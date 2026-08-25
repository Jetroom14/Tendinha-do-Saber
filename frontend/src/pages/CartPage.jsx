import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { getBookKey } from "@/lib/bookKey";
import { toast } from "sonner";
import { ShoppingBag, X, Trash2, Tag, Check, ArrowRight, ShoppingBasket } from "lucide-react";

export default function CartPage() {
  const { items, summary, promoCode, setPromoCode, add, remove, setQty, toggleLamination, recompute, bagsQty, setBags } = useCart();
  const [promoInput, setPromoInput] = useState(promoCode || "");
  const [bookMap, setBookMap] = useState({});
  const [workbookSuggestions, setWorkbookSuggestions] = useState([]);   // Bloco C2
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all(items.map((it) => api.get(`/books/${it.isbn13}`).then((r) => r.data).catch(() => null)))
      .then((arr) => {
        const map = {};
        arr.forEach((b, index) => {
          if (!b) return;
          map[b.isbn13] = b;
          map[items[index]?.isbn13] = b;
        });
        setBookMap(map);
      });
  }, [items]);

  // Bloco C2 — pedir ao backend as sugestões de caderno para os manuais no carrinho
  useEffect(() => {
    if (items.length === 0) { setWorkbookSuggestions([]); return; }
    api.post("/cart/related-workbooks", { items, promo_code: promoCode || null })
      .then((r) => setWorkbookSuggestions(r.data.suggestions || []))
      .catch(() => setWorkbookSuggestions([]));
  }, [items, promoCode]);

  const addSuggestedWorkbook = (isbn13) => {
    add(isbn13, 1);
    toast.success("Caderno adicionado ao carrinho");
  };

  const applyPromo = async () => {
    setPromoCode(promoInput.trim().toUpperCase());
    setTimeout(async () => {
      await recompute();
      const updated = await api.post("/cart/validate", { items, promo_code: promoInput.trim().toUpperCase() || null, bags_qty: bagsQty });
      if (updated.data.promo) toast.success(`Código ${updated.data.promo.code} aplicado: −${updated.data.promo.discount_value}% em cadernos`);
      else if (promoInput.trim()) toast.error("Código inválido ou não aplicável");
    }, 100);
  };

  const clearPromo = () => { setPromoCode(""); setPromoInput(""); toast("Código removido"); };

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center" data-testid="cart-empty">
        <ShoppingBag className="w-12 h-12 text-[#4A5568] mx-auto mb-4" strokeWidth={1.5}/>
        <h1 className="font-display text-3xl font-medium mb-3">O seu carrinho está vazio</h1>
        <p className="text-[#4A5568] mb-6">Explore o nosso catálogo de manuais e cadernos.</p>
        <Link to="/catalogo"><Button className="bg-[#5A8F1E] hover:bg-[#3E6E11] text-white">Ir para o catálogo</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" data-testid="cart-page">
      <h1 className="font-display text-3xl md:text-4xl font-medium mb-10">Carrinho</h1>

      <div className="grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-3">
          {items.map((it) => {
            const book = bookMap[it.isbn13];
            const line = summary?.lines?.find((l) => l.item_key === it.isbn13);
            const title = book?.title || line?.title || `Livro ${it.isbn13}`;
            const publisher = book?.publisher || "";
            const imageUrl = book?.image_url || line?.image_url || "";
            const detailKey = book ? getBookKey(book) : it.isbn13;
            const isLaminationEligible = Boolean(book?.is_lamination_eligible);
            return (
              <div key={it.isbn13} className="bg-white border border-[#E2E8F0] rounded-md p-5 flex gap-4" data-testid={`cart-item-${it.isbn13}`}>
                <div className="w-20 h-28 bg-[#F5F8EC] rounded shrink-0 overflow-hidden">
                  {imageUrl && <img src={imageUrl} alt="" className="w-full h-full object-cover"/>}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      {book ? (
                        <Link to={`/livro/${encodeURIComponent(detailKey)}`} className="font-display font-medium text-[#1A202C] hover:text-[#5A8F1E]">{title}</Link>
                      ) : (
                        <div className="font-display font-medium text-[#1A202C]">{title}</div>
                      )}
                      <div className="text-xs text-[#4A5568]">{publisher}{line?.type ? ` · ${line.type === "Workbook" ? "Caderno" : "Manual"}` : ""}</div>
                    </div>
                    <button onClick={() => remove(it.isbn13)} className="text-[#4A5568] hover:text-[#C53030] p-1" data-testid={`remove-${it.isbn13}`}><X className="w-4 h-4"/></button>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-4">
                    <div className="flex items-center border border-[#E2E8F0] rounded">
                      <button onClick={() => setQty(it.isbn13, it.qty - 1)} className="px-3 py-1.5 hover:bg-[#F5F8EC]" data-testid={`qty-minus-${it.isbn13}`}>−</button>
                      <span className="px-4 py-1.5 text-sm" data-testid={`qty-${it.isbn13}`}>{it.qty}</span>
                      <button onClick={() => setQty(it.isbn13, it.qty + 1)} className="px-3 py-1.5 hover:bg-[#F5F8EC]" data-testid={`qty-plus-${it.isbn13}`}>+</button>
                    </div>
                    {isLaminationEligible && (
                      <div className="flex items-center gap-2">
                        <Checkbox id={`lam-${it.isbn13}`} checked={it.lamination} onCheckedChange={() => toggleLamination(it.isbn13)} data-testid={`lamination-${it.isbn13}`}/>
                        <Label htmlFor={`lam-${it.isbn13}`} className="text-sm cursor-pointer">Plastificação (+{summary?.lamination_price?.toFixed(2) || "2.00"}€)</Label>
                      </div>
                    )}
                    <div className="ml-auto text-right">
                      {line?.line_discount > 0 && <div className="text-xs text-[#E07A1F]">−{line.line_discount.toFixed(2)}€</div>}
                      <div className="font-display font-medium text-[#1A202C]">{(line?.line_total ?? ((book?.price || 0) * it.qty)).toFixed(2)}€</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Bloco C2 — Sugestões discretas de caderno associado */}
          {workbookSuggestions.length > 0 && (
            <div className="space-y-2" data-testid="workbook-suggestions">
              {workbookSuggestions.map((s) => (
                <div key={s.workbook.id} className="flex items-center gap-3 p-3 bg-[#FDF6E3] border border-[#E6D28F] rounded-md" data-testid={`workbook-suggestion-${s.workbook.id}`}>
                  <div className="w-1 h-10 bg-[#E07A1F] rounded"/>
                  <div className="flex-1 text-sm">
                    <div className="text-[10px] uppercase tracking-wider text-[#B85F0E] font-semibold mb-0.5">Sugestão</div>
                    <div className="text-[#1A202C]">
                      Este manual tem caderno de fichas disponível — <strong>{s.workbook.title}</strong> · {s.workbook.price.toFixed(2)}€
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => addSuggestedWorkbook(s.workbook.isbn13 || s.workbook.slug)}
                    variant="outline"
                    className="border-[#5A8F1E] text-[#5A8F1E] hover:bg-[#5A8F1E] hover:text-white"
                    data-testid={`add-workbook-suggestion-${s.workbook.id}`}
                  >
                    Adicionar
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="bg-white border border-[#E2E8F0] rounded-md p-5" data-testid="bags-panel">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-md bg-[#F5F8EC] grid place-items-center shrink-0">
                <ShoppingBasket className="w-5 h-5 text-[#5A8F1E]" strokeWidth={1.5}/>
              </div>
              <div className="flex-1">
                <div className="font-display font-medium text-[#1A202C]">Sacos</div>
                <p className="text-sm text-[#4A5568] mt-1">Se precisar, pode acrescentar sacos à encomenda. Cada saco custa 0,10 €.</p>
              </div>
              <div className="w-28">
                <Label htmlFor="bags-qty" className="text-xs uppercase tracking-wider text-[#4A5568] mb-1.5 block">Quantidade</Label>
                <Input
                  id="bags-qty"
                  type="number"
                  min="0"
                  step="1"
                  value={bagsQty}
                  onChange={(e) => setBags(e.target.value)}
                  data-testid="bags-qty-input"
                />
              </div>
            </div>
          </div>
        </div>

        <aside className="lg:col-span-4">
          <div className="bg-white border border-[#E2E8F0] rounded-md p-6 sticky top-28" data-testid="cart-summary">
            <h2 className="font-display text-xl font-medium mb-5">Resumo</h2>

            {/* Promo */}
            <div className="mb-5">
              <Label className="text-xs uppercase tracking-wider text-[#4A5568] mb-2 flex items-center gap-1.5"><Tag className="w-3.5 h-3.5"/> Código promocional</Label>
              {summary?.promo ? (
                <div className="flex items-center justify-between bg-[#F0FFF4] border border-[#C6F6D5] rounded p-3" data-testid="promo-applied">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#2F855A]"/>
                    <div>
                      <div className="font-mono text-sm text-[#22543D]">{summary.promo.code}</div>
                      <div className="text-xs text-[#4A5568]">−{summary.promo.discount_value}% em cadernos</div>
                    </div>
                  </div>
                  <button onClick={clearPromo} className="text-[#4A5568] hover:text-[#C53030]" data-testid="clear-promo-btn"><Trash2 className="w-4 h-4"/></button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input value={promoInput} onChange={(e)=>setPromoInput(e.target.value.toUpperCase())} placeholder="Ex: TDNHA26" className="h-10" data-testid="promo-input"/>
                  <Button onClick={applyPromo} variant="outline" className="h-10 border-[#5A8F1E] text-[#5A8F1E] hover:bg-[#5A8F1E] hover:text-white" data-testid="apply-promo-btn">Aplicar</Button>
                </div>
              )}
              {promoCode && !summary?.promo && <p className="text-xs text-[#C53030] mt-2">Código não reconhecido.</p>}
            </div>

            <dl className="space-y-2 text-sm border-t border-[#E2E8F0] pt-4">
              <div className="flex justify-between"><dt className="text-[#4A5568]">Manuais</dt><dd className="text-[#1A202C]">{summary?.subtotal_manuals?.toFixed(2) || "0.00"}€</dd></div>
              <div className="flex justify-between"><dt className="text-[#4A5568]">Cadernos</dt><dd className="text-[#1A202C]">{summary?.subtotal_workbooks?.toFixed(2) || "0.00"}€</dd></div>
              {summary?.discount_workbooks > 0 && (
                <div className="flex justify-between text-[#E07A1F]"><dt>Desconto cadernos</dt><dd>−{summary.discount_workbooks.toFixed(2)}€</dd></div>
              )}
              {summary?.lamination_total > 0 && (
                <div className="flex justify-between"><dt className="text-[#4A5568]">Plastificação</dt><dd className="text-[#1A202C]">{summary.lamination_total.toFixed(2)}€</dd></div>
              )}
              {summary?.bags_total > 0 && (
                <div className="flex justify-between"><dt className="text-[#4A5568]">Sacos ({summary.bags_qty || 0})</dt><dd className="text-[#1A202C]">{summary.bags_total.toFixed(2)}€</dd></div>
              )}
              <div className="flex justify-between text-lg font-display font-medium pt-3 border-t border-[#E2E8F0]">
                <dt>Total</dt><dd data-testid="cart-total">{summary?.total?.toFixed(2) || "0.00"}€</dd>
              </div>
            </dl>

            <Button onClick={() => navigate("/checkout")} className="w-full mt-5 h-12 bg-[#E07A1F] hover:bg-[#B85F0E] text-white" data-testid="checkout-btn">
              Continuar para pagamento <ArrowRight className="w-4 h-4 ml-2" strokeWidth={1.5}/>
            </Button>
            <p className="text-xs text-[#4A5568] mt-3 text-center">O custo de entrega é calculado no checkout conforme o concelho escolhido.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
