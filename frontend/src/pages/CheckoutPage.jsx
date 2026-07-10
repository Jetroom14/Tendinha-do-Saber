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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SEO from "@/components/SEO";
import { toast } from "sonner";
import { Truck, Check, AlertTriangle, CreditCard, MapPin, FileText } from "lucide-react";

// Bloco C: validação NIF PT (algoritmo oficial do dígito de controlo).
// 1º dígito válido: 1,2,3 (singulares), 5 (empresas), 6 (adm. pública),
// 8 (ENI), 9 (outras coletivas). 4 e 7 não são atribuídos oficialmente.
const NIF_FIRST_DIGITS = new Set(["1", "2", "3", "5", "6", "8", "9"]);
function validatePtNif(nif) {
  const n = (nif || "").replace(/\D/g, "");
  if (n.length !== 9) return false;
  if (!NIF_FIRST_DIGITS.has(n[0])) return false;
  const weights = [9, 8, 7, 6, 5, 4, 3, 2];
  const sum = weights.reduce((acc, w, i) => acc + parseInt(n[i], 10) * w, 0);
  const remainder = sum % 11;
  const check = remainder < 2 ? 0 : 11 - remainder;
  return check === parseInt(n[8], 10);
}

export default function CheckoutPage() {
  const { items, summary, promoCode, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    concelho: "",
    address: "",
    postal_code: "",
    notes: "",
    accept_terms: false,
    // Bloco C: fatura com NIF
    wants_invoice: false,
    nif: "",
    fiscal_name: "",
  });
  const [postcodeCheck, setPostcodeCheck] = useState(null);
  const [shippingZones, setShippingZones] = useState([]);   // Bloco B
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (items.length === 0) navigate("/carrinho");
  }, [items, navigate]);

  // Bloco B: carregar lista de concelhos + custo por concelho
  useEffect(() => {
    api.get("/shipping/zones").then((r) => setShippingZones(r.data.concelhos || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (form.postal_code && form.postal_code.length >= 4) {
      api.get(`/postcode/check?code=${form.postal_code}`)
        .then((r) => setPostcodeCheck(r.data))
        .catch(() => setPostcodeCheck(null));
    } else setPostcodeCheck(null);
  }, [form.postal_code]);

  const handle = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  // Bloco B: custo de entrega do concelho selecionado
  const selectedZone = shippingZones.find((z) => z.name === form.concelho);
  const shippingCost = selectedZone ? Number(selectedZone.rate || 0) : 0;
  const grandTotal = (summary?.total || 0) + shippingCost;

  const submit = async (e) => {
    e.preventDefault();
    if (!form.concelho) {
      toast.error("Escolha o concelho de entrega.");
      return;
    }
    if (!form.accept_terms) {
      toast.error("Aceite os termos para continuar");
      return;
    }
    // Bloco C: validação NIF quando fatura pedida
    if (form.wants_invoice) {
      if (!validatePtNif(form.nif)) {
        toast.error("NIF inválido, verifique.");
        return;
      }
      if (!form.fiscal_name.trim()) {
        toast.error("Indique o nome fiscal (quem levará a fatura).");
        return;
      }
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
        delivery_concelho: form.concelho,
        address: form.address,
        postal_code: form.postal_code,
        notes: form.notes,
        wants_invoice: form.wants_invoice,
        nif: form.wants_invoice ? form.nif.replace(/\D/g, "") : null,
        fiscal_name: form.wants_invoice ? form.fiscal_name.trim() : null,
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
                <p className="text-sm text-[#4A5568] mt-1">A Tendinha do Saber entrega-lhe os manuais pessoalmente em qualquer concelho do distrito de Aveiro. O valor de entrega depende do concelho.</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-xs uppercase tracking-wider text-[#4A5568] mb-1.5 block">Concelho de entrega *</Label>
                <Select value={form.concelho} onValueChange={(v) => setForm({...form, concelho: v})}>
                  <SelectTrigger data-testid="checkout-concelho"><SelectValue placeholder="Selecione o concelho..."/></SelectTrigger>
                  <SelectContent>
                    {shippingZones.map((z) => (
                      <SelectItem key={z.name} value={z.name}>{z.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-[#4A5568] mb-1.5 block">Morada de entrega *</Label>
                <Input required value={form.address} onChange={handle("address")} placeholder="Rua, número, andar" data-testid="checkout-address"/>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-[#4A5568] mb-1.5 block">Código Postal *</Label>
                <Input required value={form.postal_code} onChange={handle("postal_code")} placeholder="Ex: 3800-XXX ou 4500-XXX" data-testid="checkout-postcode"/>
                {postcodeCheck && form.postal_code && (
                  postcodeCheck.in_aveiro_district ? (
                    <p className="text-xs text-[#2F855A] mt-1.5 flex items-center gap-1" data-testid="postcode-ok"><Check className="w-3.5 h-3.5"/> Código postal do distrito de Aveiro</p>
                  ) : (
                    <p className="text-xs text-[#B85F0E] mt-1.5 flex items-start gap-1" data-testid="postcode-bad">
                      <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0"/>
                      <span>Este código postal não parece ser do distrito de Aveiro. Confirme, por favor. Se está correto e é do distrito, pode continuar na mesma.</span>
                    </p>
                  )
                )}
              </div>
              <div className="flex items-start gap-2 p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0"/>
                <span>Confirme que o <strong>concelho</strong> e o <strong>código postal</strong> correspondem à morada de entrega.</span>
              </div>
            </div>
          </section>

          {/* Bloco C — Fatura com NIF */}
          <section className="bg-white border border-[#E2E8F0] rounded-md p-6" data-testid="invoice-section">
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={form.wants_invoice}
                onCheckedChange={(v) => setForm({...form, wants_invoice: !!v, nif: v ? form.nif : "", fiscal_name: v ? form.fiscal_name : ""})}
                data-testid="checkout-wants-invoice"
              />
              <span className="flex-1">
                <span className="flex items-center gap-2 font-display font-medium text-[#1A202C]">
                  <FileText className="w-4 h-4 text-[#5A8F1E]" strokeWidth={1.5}/>
                  Quero fatura com NIF (contribuinte)
                </span>
                <span className="block text-xs text-[#4A5568] mt-1">
                  Recolhemos os dados de faturação; a fatura será emitida manualmente e enviada por email.
                </span>
              </span>
            </label>
            {form.wants_invoice && (
              <div className="mt-5 grid sm:grid-cols-2 gap-4" data-testid="invoice-fields">
                <div>
                  <Label className="text-xs uppercase tracking-wider text-[#4A5568] mb-1.5 block">NIF *</Label>
                  <Input
                    value={form.nif}
                    onChange={(e) => setForm({...form, nif: e.target.value.replace(/\D/g, "").slice(0, 9)})}
                    inputMode="numeric"
                    placeholder="9 dígitos"
                    className={`font-mono ${form.nif && !validatePtNif(form.nif) ? "border-rose-400" : ""}`}
                    data-testid="checkout-nif"
                  />
                  {form.nif && !validatePtNif(form.nif) && (
                    <p className="text-xs text-rose-600 mt-1" data-testid="nif-error">NIF inválido, verifique.</p>
                  )}
                  {form.nif && validatePtNif(form.nif) && (
                    <p className="text-xs text-emerald-700 mt-1 flex items-center gap-1" data-testid="nif-ok"><Check className="w-3 h-3"/> NIF válido</p>
                  )}
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-[#4A5568] mb-1.5 block">Nome fiscal *</Label>
                  <Input
                    value={form.fiscal_name}
                    onChange={(e) => setForm({...form, fiscal_name: e.target.value})}
                    placeholder="Nome de quem levará a fatura"
                    data-testid="checkout-fiscal-name"
                  />
                </div>
              </div>
            )}
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
              <div className="flex justify-between" data-testid="checkout-shipping-line">
                <dt className="text-[#4A5568]">Entrega em mão {form.concelho && <span className="text-xs text-slate-400">· {form.concelho}</span>}</dt>
                <dd className={shippingCost === 0 ? "text-[#2F855A]" : ""}>{shippingCost === 0 ? "Grátis" : `${shippingCost.toFixed(2).replace(".", ",")} €`}</dd>
              </div>
              <div className="flex justify-between text-lg font-display font-medium pt-3 border-t border-[#E2E8F0]">
                <dt>Total</dt><dd data-testid="checkout-total">{grandTotal.toFixed(2).replace(".", ",")} €</dd>
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
