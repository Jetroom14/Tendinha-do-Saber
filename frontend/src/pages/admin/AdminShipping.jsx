import { useEffect, useState } from "react";
import api, { formatApiErrorDetail } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Truck, Save, Info } from "lucide-react";

/**
 * Bloco B — Custos de Entrega por Concelho
 * Lista os 19 concelhos do distrito de Aveiro com um input editável por concelho.
 * Valor por defeito: 0 € (grátis). Acesso: admin / super_admin (require_manager).
 */
export default function AdminShipping() {
  const [rates, setRates] = useState({});
  const [concelhos, setConcelhos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/admin/shipping-rates");
        setConcelhos(data.concelhos || []);
        setRates(data.rates || {});
      } catch {
        toast.error("Erro ao carregar custos de entrega");
      } finally { setLoading(false); }
    })();
  }, []);

  const setRate = (concelho, value) => {
    setRates((r) => ({ ...r, [concelho]: value }));
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      // Normalizar: aceita "1,50" ou "1.50" ou vazio (= 0)
      const clean = {};
      for (const c of concelhos) {
        const raw = String(rates[c] ?? "").replace(",", ".").trim();
        const num = raw === "" ? 0 : parseFloat(raw);
        clean[c] = Number.isFinite(num) && num >= 0 ? num : 0;
      }
      const { data } = await api.put("/admin/shipping-rates", { rates: clean });
      setRates(data.rates);
      setDirty(false);
      toast.success("Custos de entrega guardados");
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail) || "Erro ao guardar");
    } finally { setSaving(false); }
  };

  const setAllZero = () => {
    const z = Object.fromEntries(concelhos.map((c) => [c, 0]));
    setRates(z); setDirty(true);
  };

  return (
    <div className="p-8 max-w-3xl" data-testid="admin-shipping">
      <div className="mb-6">
        <div className="text-[10px] tracking-[0.2em] uppercase text-slate-500 font-semibold">Logística</div>
        <h1 className="font-display text-3xl font-medium text-slate-900">Custos de Entrega</h1>
        <p className="text-sm text-slate-600 mt-1">Defina o valor de entrega em mão para cada concelho do distrito de Aveiro. Deixe a 0 para entrega grátis.</p>
      </div>

      <div className="bg-[#F5F8EC] border border-[#E2E8F0] rounded-md p-4 mb-6 flex items-start gap-3">
        <Info className="w-5 h-5 text-[#5A8F1E] mt-0.5 shrink-0" strokeWidth={1.5}/>
        <div className="text-sm text-slate-700">
          <strong>Como funciona:</strong> no checkout, o cliente escolhe o concelho de entrega a partir desta lista. O total da encomenda soma o valor de entrega correspondente. Concelhos com valor <strong>0 €</strong> aparecem como <strong>“Grátis”</strong> ao cliente.
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-slate-500 p-6">A carregar...</div>
      ) : (
        <>
          <div className="bg-white border border-slate-200 rounded-md p-2">
            <div className="grid sm:grid-cols-2 divide-y divide-slate-100 sm:divide-y-0 sm:gap-x-8">
              {concelhos.map((c) => (
                <div key={c} className="flex items-center gap-3 py-2.5 px-2 sm:col-span-1">
                  <Label className="flex-1 text-sm text-slate-800" htmlFor={`rate-${c}`}>{c}</Label>
                  <div className="relative w-24">
                    <Input
                      id={`rate-${c}`}
                      type="number"
                      step="0.01"
                      min="0"
                      value={rates[c] ?? 0}
                      onChange={(e) => setRate(c, e.target.value)}
                      className="pr-6 text-right font-mono text-sm h-9"
                      data-testid={`shipping-rate-${c}`}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">€</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between mt-6">
            <button
              type="button"
              onClick={setAllZero}
              className="text-xs text-slate-500 hover:text-slate-800 underline underline-offset-2"
              data-testid="shipping-zero-all"
            >
              Repor tudo a 0 €
            </button>
            <Button
              onClick={save}
              disabled={saving || !dirty}
              className="bg-[#5A8F1E] hover:bg-[#3E6E11] text-white disabled:bg-slate-300"
              data-testid="shipping-save-btn"
            >
              <Save className="w-4 h-4 mr-2"/>{saving ? "A guardar..." : "Guardar custos"}
            </Button>
          </div>
        </>
      )}

      <div className="mt-10 bg-slate-50 border border-slate-200 rounded-md p-4 text-xs text-slate-500 flex items-start gap-3">
        <Truck className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" strokeWidth={1.5}/>
        <div>
          <strong className="text-slate-700">Nota sobre CTT (futuro):</strong> a estrutura para envio via CTT está preparada no sistema mas <strong>desativada por omissão</strong>. Quando quiser oferecer envios CTT para além da entrega em mão, poderemos ativar em conjunto (implica configurar API dos CTT + tabela de portes).
        </div>
      </div>
    </div>
  );
}
