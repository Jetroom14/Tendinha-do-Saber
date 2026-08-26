import { useEffect, useState } from "react";
import api, { formatApiErrorDetail } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Save, Trash2, ArrowUp, ArrowDown } from "lucide-react";

const BLANK = { question: "", answer: "" };

export default function AdminFaq() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(BLANK);
  const [savingId, setSavingId] = useState("");
  const [savingOrder, setSavingOrder] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get("/admin/faq");
      setItems((data.items || []).map((item, index) => ({ ...item, sort_order: item.sort_order || index + 1 })));
    } catch {
      toast.error("Erro ao carregar FAQ");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createItem = async () => {
    if (!form.question.trim() || !form.answer.trim()) {
      toast.error("Preencha a pergunta e a resposta");
      return;
    }
    try {
      await api.post("/admin/faq", { question: form.question.trim(), answer: form.answer.trim() });
      setForm(BLANK);
      toast.success("Pergunta adicionada");
      load();
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail) || "Erro ao criar FAQ");
    }
  };

  const updateItem = async (item) => {
    setSavingId(item.id);
    try {
      await api.put(`/admin/faq/${item.id}`, {
        question: item.question.trim(),
        answer: item.answer.trim(),
        sort_order: item.sort_order,
      });
      toast.success("Pergunta atualizada");
      load();
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail) || "Erro ao guardar FAQ");
    } finally {
      setSavingId("");
    }
  };

  const deleteItem = async (item) => {
    if (!confirm("Apagar esta pergunta?")) return;
    try {
      await api.delete(`/admin/faq/${item.id}`);
      toast.success("Pergunta apagada");
      load();
    } catch {
      toast.error("Erro ao apagar FAQ");
    }
  };

  const moveItem = (index, direction) => {
    const next = [...items];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next.map((item, idx) => ({ ...item, sort_order: idx + 1 })));
  };

  const saveOrder = async () => {
    setSavingOrder(true);
    try {
      await api.post("/admin/faq/reorder", {
        items: items.map((item, index) => ({ id: item.id, sort_order: index + 1 })),
      });
      toast.success("Ordem guardada");
      load();
    } catch {
      toast.error("Erro ao guardar ordem");
    } finally {
      setSavingOrder(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl" data-testid="admin-faq">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <div className="text-[10px] tracking-[0.2em] uppercase text-slate-500 font-semibold">Conteúdo</div>
          <h1 className="font-display text-3xl font-medium text-slate-900">Perguntas Frequentes</h1>
          <p className="text-sm text-slate-600 mt-1">Adicione, edite, apague e reordene as perguntas mostradas na página pública de FAQ.</p>
        </div>
        <Button onClick={saveOrder} disabled={savingOrder || items.length === 0} className="bg-[#5A8F1E] hover:bg-[#3E6E11] text-white" data-testid="faq-save-order">
          <Save className="w-4 h-4 mr-2"/>{savingOrder ? "A guardar..." : "Guardar ordem"}
        </Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-md p-5 mb-6 space-y-3">
        <div className="grid gap-3">
          <div>
            <Label>Pergunta</Label>
            <Input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} data-testid="faq-new-question" />
          </div>
          <div>
            <Label>Resposta</Label>
            <Textarea value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} rows={4} data-testid="faq-new-answer" />
          </div>
        </div>
        <Button onClick={createItem} className="bg-[#5A8F1E] hover:bg-[#3E6E11] text-white" data-testid="faq-add-btn">
          <Plus className="w-4 h-4 mr-2"/>Adicionar pergunta
        </Button>
      </div>

      <div className="space-y-4">
        {items.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-md p-8 text-sm text-slate-500">Ainda não há perguntas configuradas.</div>
        ) : items.map((item, index) => (
          <div key={item.id} className="bg-white border border-slate-200 rounded-md p-5" data-testid={`faq-item-${item.id}`}>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="text-xs uppercase tracking-wider text-slate-500">Ordem {index + 1}</div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => moveItem(index, -1)} className="p-2 rounded hover:bg-slate-100" disabled={index === 0} data-testid={`faq-up-${item.id}`}><ArrowUp className="w-4 h-4"/></button>
                <button type="button" onClick={() => moveItem(index, 1)} className="p-2 rounded hover:bg-slate-100" disabled={index === items.length - 1} data-testid={`faq-down-${item.id}`}><ArrowDown className="w-4 h-4"/></button>
                <button type="button" onClick={() => deleteItem(item)} className="p-2 rounded hover:bg-rose-100 text-rose-700" data-testid={`faq-delete-${item.id}`}><Trash2 className="w-4 h-4"/></button>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <Label>Pergunta</Label>
                <Input value={item.question} onChange={(e) => setItems((cur) => cur.map((entry) => entry.id === item.id ? { ...entry, question: e.target.value } : entry))} data-testid={`faq-question-${item.id}`} />
              </div>
              <div>
                <Label>Resposta</Label>
                <Textarea value={item.answer} onChange={(e) => setItems((cur) => cur.map((entry) => entry.id === item.id ? { ...entry, answer: e.target.value } : entry))} rows={5} data-testid={`faq-answer-${item.id}`} />
              </div>
              <div className="flex justify-end">
                <Button onClick={() => updateItem(item)} disabled={savingId === item.id} className="bg-[#5A8F1E] hover:bg-[#3E6E11] text-white" data-testid={`faq-save-${item.id}`}>
                  <Save className="w-4 h-4 mr-2"/>{savingId === item.id ? "A guardar..." : "Guardar"}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
