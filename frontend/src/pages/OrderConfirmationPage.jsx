import { useCallback, useEffect, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import api from "@/lib/api";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OrderConfirmationPage() {
  const { orderNo } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fallback, setFallback] = useState(false);

  const refreshOrder = useCallback(() => {
    const token = sessionStorage.getItem(`ts_order_access_${orderNo}`);
    if (!token) {
      setFallback(true);
      return Promise.resolve();
    }
    return api
      .get(`/orders/${orderNo}`, {
        headers: {
          "X-Order-Access-Token": token,
        },
      })
      .then((r) => {
        setOrder(r.data);
        setFallback(false);
      })
      .catch((err) => {
        const status = err?.response?.status;
        if (status === 401 || status === 404) {
          setFallback(true);
        }
      });
  }, [orderNo]);

  useEffect(() => {
    const stateOrder = location.state?.order;
    if (stateOrder?.order_no === orderNo) {
      setOrder(stateOrder);
      setLoading(false);
      setFallback(false);
      return;
    }

    const token = sessionStorage.getItem(`ts_order_access_${orderNo}`);
    if (!token) {
      setFallback(true);
      setLoading(false);
      return;
    }

    refreshOrder()
      .finally(() => {
        setLoading(false);
      });
  }, [orderNo, location.state, refreshOrder]);

  useEffect(() => {
    if (!order || order.payment?.method !== "mbway" || !["pending", "unknown"].includes(order.payment?.status)) {
      return undefined;
    }
    let active = true;
    let attempts = 0;
    const interval = setInterval(() => {
      attempts += 1;
      refreshOrder().finally(() => {
        if (!active || attempts >= 20) {
          clearInterval(interval);
        }
      });
    }, 15000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [order, refreshOrder]);

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-20 text-center" data-testid="order-loading">A carregar...</div>;

  if (!order || fallback) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16" data-testid="order-fallback">
        <h1 className="font-display text-3xl md:text-4xl font-medium mb-3">Pedido de encomenda</h1>
        <p className="text-[#4A5568] mb-4">
          Não foi possível recuperar automaticamente os detalhes desta encomenda.
          Utilize “Seguir encomenda” com o número da encomenda e o email utilizado na compra.
        </p>
        <p className="text-sm text-[#4A5568] mb-6">Número da encomenda: <span className="font-mono">{orderNo}</span></p>
        <Link to="/seguir-encomenda" className="text-[#5A8F1E] hover:underline">Ir para Seguir encomenda</Link>
      </div>
    );
  }

  const payment = order.payment || {};
  const paymentPending = order.payment_status === "pending" || payment.status === "pending";
  const paymentPaid = order.payment_status === "paid" || payment.status === "paid";
  const paymentUnknown = order.payment_status === "unknown" || payment.status === "unknown";
const paymentFailed = order.payment_status === "failed" || payment.status === "failed";
  const copyReference = async () => {
    if (!payment.reference) return;
    try {
      await navigator.clipboard.writeText(String(payment.reference));
    } catch {
      // no-op
    }
  };

    return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16" data-testid="order-confirmation">
      <div className="text-center mb-10">
        <CheckCircle2
          className={`w-14 h-14 mx-auto mb-4 ${paymentPaid ? "text-[#2F855A]" : "text-[#E07A1F]"}`}
          strokeWidth={1.5}
        />
        <h1 className="font-display text-3xl md:text-4xl font-medium mb-3">
          {paymentPaid
            ? "Pagamento confirmado — encomenda aceite"
            : paymentFailed
              ? "Pagamento não concluído"
              : "Pedido de encomenda recebido"}
        </h1>
        <p className="text-[#4A5568]">
          {paymentPaid
            ? "O pagamento foi confirmado e a encomenda foi aceite."
            : paymentFailed
              ? "O pagamento não foi concluído. A encomenda não foi aceite."
              : paymentUnknown
                ? "Estado do pagamento em verificação. Não repita o pagamento. Estamos a aguardar confirmação do operador."
                : "A encomenda será aceite quando o pagamento for confirmado."}
        </p>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-md p-6">
        <div className="grid grid-cols-2 gap-4 text-sm mb-5">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[#4A5568]">Nº de Encomenda</div>
            <div className="font-mono text-[#1A202C]" data-testid="order-no">{order.order_no}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[#4A5568]">Estado</div>
            <div className="text-[#1A202C]">
              {paymentPaid
                ? "Pago"
                : paymentFailed
                  ? "Pagamento recusado"
                  : paymentUnknown
                    ? "Estado do pagamento em verificação"
                    : paymentPending
                      ? "Pagamento pendente"
                      : order.payment_status}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[#4A5568]">Entrega</div>
            <div className="text-[#1A202C]">
              {order.delivery.method === "hand_delivery" ? "Entrega ao domicílio (Aveiro)" : "Envio"}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[#4A5568]">Total</div>
            <div className="font-display text-xl text-[#1A202C]">{order.totals.total.toFixed(2)}€</div>
          </div>
        </div>

        <div className="border-t border-[#E2E8F0] pt-4 pb-4 space-y-3">
          {payment.method === "multibanco" && (
            <div data-testid="payment-multibanco-block">
              <div className="text-[10px] uppercase tracking-wider text-[#4A5568] mb-2">Multibanco</div>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div><div className="text-[#4A5568]">Entidade</div><div className="font-mono text-[#1A202C]">{payment.entity || "—"}</div></div>
                <div><div className="text-[#4A5568]">Referência</div><div className="font-mono text-[#1A202C]">{payment.reference || "—"}</div></div>
                <div><div className="text-[#4A5568]">Valor</div><div className="text-[#1A202C]">{payment.amount || "—"}€</div></div>
                <div><div className="text-[#4A5568]">Validade</div><div className="text-[#1A202C]">{payment.expires_at || "—"}</div></div>
              </div>
              {payment.reference && <Button type="button" variant="outline" className="mt-3" onClick={copyReference}>Copiar referência</Button>}
            </div>
          )}
          {payment.method === "payshop" && (
            <div data-testid="payment-payshop-block">
              <div className="text-[10px] uppercase tracking-wider text-[#4A5568] mb-2">Payshop</div>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div><div className="text-[#4A5568]">Referência</div><div className="font-mono text-[#1A202C]">{payment.reference || "—"}</div></div>
                <div><div className="text-[#4A5568]">Valor</div><div className="text-[#1A202C]">{payment.amount || "—"}€</div></div>
                <div><div className="text-[#4A5568]">Validade</div><div className="text-[#1A202C]">{payment.expires_at || "—"}</div></div>
              </div>
              {payment.reference && <Button type="button" variant="outline" className="mt-3" onClick={copyReference}>Copiar referência</Button>}
            </div>
          )}
          {payment.method === "mbway" && (paymentPending || paymentUnknown) && (
            <div data-testid="payment-mbway-block">
              <div className="text-[10px] uppercase tracking-wider text-[#4A5568] mb-2">MB WAY</div>
              <p className="text-[#1A202C]">{paymentUnknown ? "Estado do pagamento em verificação" : "Pedido enviado para o MB WAY."}</p>
              <p className="text-[#4A5568] mt-1">{paymentUnknown ? "Não repita o pagamento. Estamos a aguardar confirmação do operador." : "Abra a aplicação MB WAY e confirme o pagamento."}</p>
              <p className="text-sm text-[#4A5568] mt-2">Número: {payment.mobile_masked || "***"}</p>
              <Button type="button" variant="outline" className="mt-3" onClick={refreshOrder}>Atualizar estado</Button>
            </div>
          )}
        </div>

        <div className="border-t border-[#E2E8F0] pt-4 space-y-2">
          {order.items.map((it) => (
            <div key={it.isbn13} className="flex justify-between text-sm">
              <span>{it.qty}× {it.title}</span>
              <span>{it.line_total.toFixed(2)}€</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-8 text-center">
        <Link to="/catalogo" className="text-[#5A8F1E] hover:underline">Continuar a comprar</Link>
      </div>
    </div>
  );
}
