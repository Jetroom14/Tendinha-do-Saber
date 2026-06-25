import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/lib/api";
import { CheckCircle2 } from "lucide-react";

export default function OrderConfirmationPage() {
  const { orderNo } = useParams();
  const [order, setOrder] = useState(null);
  useEffect(() => { api.get(`/orders/${orderNo}`).then((r) => setOrder(r.data)); }, [orderNo]);

  if (!order) return <div className="max-w-3xl mx-auto px-4 py-20 text-center" data-testid="order-loading">A carregar...</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16" data-testid="order-confirmation">
      <div className="text-center mb-10">
        <CheckCircle2 className="w-14 h-14 text-[#2F855A] mx-auto mb-4" strokeWidth={1.5}/>
        <h1 className="font-display text-3xl md:text-4xl font-medium mb-3">Encomenda confirmada</h1>
        <p className="text-[#4A5568]">Será contactado por <strong>{order.customer.phone}</strong> ou email para confirmar o pagamento.</p>
      </div>
      <div className="bg-white border border-[#E2E8F0] rounded-md p-6">
        <div className="grid grid-cols-2 gap-4 text-sm mb-5">
          <div><div className="text-[10px] uppercase tracking-wider text-[#4A5568]">Nº de Encomenda</div><div className="font-mono text-[#1A202C]" data-testid="order-no">{order.order_no}</div></div>
          <div><div className="text-[10px] uppercase tracking-wider text-[#4A5568]">Estado</div><div className="text-[#1A202C]">Pagamento pendente</div></div>
          <div><div className="text-[10px] uppercase tracking-wider text-[#4A5568]">Entrega</div><div className="text-[#1A202C]">{order.delivery.method === "hand_delivery" ? "Em mão (Aveiro)" : "Levantamento na loja"}</div></div>
          <div><div className="text-[10px] uppercase tracking-wider text-[#4A5568]">Total</div><div className="font-display text-xl text-[#1A202C]">{order.totals.total.toFixed(2)}€</div></div>
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
