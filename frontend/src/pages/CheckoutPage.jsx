import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import api, { formatApiErrorDetail } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import SEO from "@/components/SEO";
import { toast } from "sonner";
import { Truck, Check, AlertTriangle, CreditCard } from "lucide-react";

export default function CheckoutPage() {
  const { items, summary, promoCode, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    address: "",
    postal_code: "",
    notes: "",
    accept_terms: false,
  });
  const [postcodeCheck, setPostcodeCheck] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (items.length === 0) navigate("/carrinho");
  }, [items, navigate]);

  useEffect(() => {
    if (form.postal_code && form.postal_code.length >= 4) {
      api.get(`/postcode/check?code=${form.postal_code}`)
        .then((r) => setPostcodeCheck(r.data))
        .catch(() => setPostcodeCheck(null));
    } else setPostcodeCheck(null);
  }, [form.postal_code]);

  const handle = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!postcodeCheck?.hand_delivery_available) {
      toast.error("Apenas fazemos entrega em mão no distrito de Aveiro. Para outras localidades, contacte-nos.");
      return;
    }
    if (!form.accept_terms) {
      toast.error("Aceite os termos para continuar");
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post("/orders", {
        items,
        promo_code: promoCode || null,
        customer_name: form.name,
        customer_email: form.email,
        customer_phone: form.phone,
        delivery_method: "hand_delivery",
        address: form.address,
        postal_code: form.postal_code,
        notes: form.notes,
      });
      toast.success(`Encomenda ${data.order_no} criada!`);
      clear();
      navigate(`/encomenda/${data.order_no}`);
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Erro ao criar encomenda");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12" data-testid="checkout-page">
      <SEO title="Finalizar encomenda" path="/checkout" noIndex/>
      <h1 className="font-display text-3xl md:text-4xl font-medium mb-10">Finalizar encomenda</h1>

      <form onSubmit={submit} className="grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 space-y-8">
          <section className="bg-white border border-[#E2E8F0] rounded-md p-6">
            <h2 className="font-display text-lg font-medium mb-4">Dados de contacto</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs uppercase tracking-wider text-[#4A5568] mb-1.5 block">Nome completo *</Label>
                <Input required value={form.name} onChange={handle("name")} data-testid="checkout-name"/>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-[#4A5568] mb-1.5 block">Email *</Label>
                <Input required type="email" value={form.email} onChange={handle("email")} data-testid="checkout-email"/>
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs uppercase tracking-wider text-[#4A5568] mb-1.5 block">Telefone *</Label>
                <Input required value={form.phone} onChange={handle("phone")} placeholder="+351 ..." data-testid="checkout-phone"/>
              </div>
            </div>
          </section>

          <section className="bg-white border border-[#E2E8F0] rounded-md p-6">
            <div className="flex items-start gap-3 mb-5 p-4 bg-[#F5F8EC] rounded-md border border-[#E2E8F0]">
              <Truck className="w-5 h-5 text-[#5A8F1E] mt-0.5 shrink-0" strokeWidth={1.5}/>
              <div>
                <h2 className="font-display font-medium text-[#1A202C]">Entrega em mão · Distrito de Aveiro</h2>
                <p className="text-sm text-[#4A5568] mt-1">O Francisco entrega-lhe os manuais pessoalmente, sem custos adicionais.</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-xs uppercase tracking-wider text-[#4A5568] mb-1.5 block">Morada de entrega *</Label>
                <Input required value={form.address} onChange={handle("address")} placeholder="Rua, número, andar" data-testid="checkout-address"/>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-[#4A5568] mb-1.5 block">Código Postal *</Label>
                <Input required value={form.postal_code} onChange={handle("postal_code")} placeholder="3800-XXX" data-testid="checkout-postcode"/>
                {postcodeCheck && form.postal_code && (
                  postcodeCheck.hand_delivery_available ? (
                    <p className="text-xs text-[#2F855A] mt-1.5 flex items-center gap-1" data-testid="postcode-ok"><Check className="w-3.5 h-3.5"/> Entrega em mão disponível</p>
                  ) : (
                    <p className="text-xs text-[#C53030] mt-1.5 flex items-start gap-1" data-testid="postcode-bad">
                      <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0"/>
                      <span>Fora do distrito de Aveiro. Contacte-nos diretamente em <a href="mailto:tendinhadosaber@gmail.com" className="underline">tendinhadosaber@gmail.com</a> ou +351 926 384 352.</span>
                    </p>
                  )
                )}
              </div>
            </div>
          </section>

          <section className="bg-white border border-[#E2E8F0] rounded-md p-6">
            <h2 className="font-display text-lg font-medium mb-4">Notas para a encomenda</h2>
            <Textarea value={form.notes} onChange={handle("notes")} placeholder="Hora preferida de entrega, escola, ano do aluno..." data-testid="checkout-notes"/>
          </section>

          <section className="bg-[#F5F8EC] border border-[#E2E8F0] rounded-md p-5 flex items-start gap-3" data-testid="payment-mock-notice">
            <CreditCard className="w-5 h-5 text-[#5A8F1E] mt-0.5" strokeWidth={1.5}/>
            <div>
              <div className="font-display font-medium text-sm">Pagamento</div>
              <p className="text-sm text-[#4A5568] mt-1">
                Será contactado para combinar o pagamento via <strong>MB Way / Multibanco (Ifthenpay)</strong>. A fatura-recibo é emitida automaticamente após confirmação.
              </p>
            </div>
          </section>

          <label className="flex items-start gap-2 text-sm text-[#1A202C]">
            <Checkbox required checked={form.accept_terms} onCheckedChange={(v) => setForm({...form, accept_terms: !!v})} data-testid="checkout-terms"/>
            <span>Li e aceito a <a href="/legal/privacidade" className="text-[#5A8F1E] hover:underline" target="_blank" rel="noreferrer">Política de Privacidade</a> e os <a href="/legal/termos" className="text-[#5A8F1E] hover:underline" target="_blank" rel="noreferrer">Termos & Condições</a>.</span>
          </label>
        </div>

        <aside className="lg:col-span-5">
          <div className="bg-white border border-[#E2E8F0] rounded-md p-6 lg:sticky lg:top-28" data-testid="checkout-summary">
            <h2 className="font-display text-lg font-medium mb-4">A sua encomenda</h2>
            <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
              {summary?.lines?.map((l) => (
                <div key={l.isbn13} className="flex justify-between text-sm">
                  <span className="text-[#1A202C] flex-1 pr-2">{l.qty}× {l.title}</span>
                  <span className="text-[#1A202C]">{l.line_total.toFixed(2)}€</span>
                </div>
              ))}
            </div>
            <dl className="space-y-2 text-sm border-t border-[#E2E8F0] pt-4">
              <div className="flex justify-between"><dt className="text-[#4A5568]">Manuais</dt><dd>{summary?.subtotal_manuals?.toFixed(2)}€</dd></div>
              <div className="flex justify-between"><dt className="text-[#4A5568]">Cadernos</dt><dd>{summary?.subtotal_workbooks?.toFixed(2)}€</dd></div>
              {summary?.discount_workbooks > 0 && <div className="flex justify-between text-[#E07A1F]"><dt>Desconto</dt><dd>−{summary.discount_workbooks.toFixed(2)}€</dd></div>}
              {summary?.lamination_total > 0 && <div className="flex justify-between"><dt className="text-[#4A5568]">Plastificação</dt><dd>{summary.lamination_total.toFixed(2)}€</dd></div>}
              <div className="flex justify-between"><dt className="text-[#4A5568]">Entrega em mão</dt><dd className="text-[#2F855A]">Grátis</dd></div>
              <div className="flex justify-between text-lg font-display font-medium pt-3 border-t border-[#E2E8F0]">
                <dt>Total</dt><dd>{summary?.total?.toFixed(2)}€</dd>
              </div>
            </dl>
            <Button type="submit" disabled={submitting} className="w-full mt-6 h-12 bg-[#E07A1F] hover:bg-[#B85F0E] text-white" data-testid="place-order-btn">
              {submitting ? "A processar..." : "Confirmar encomenda"}
            </Button>
          </div>
        </aside>
      </form>
    </div>
  );
}
