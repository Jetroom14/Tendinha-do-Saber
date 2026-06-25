import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";

export default function AdminSchools() {
  const [munis, setMunis] = useState([]);
  const [schools, setSchools] = useState([]);
  const [selectedMun, setSelectedMun] = useState("");
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkForm, setLinkForm] = useState({ school_id: "", isbn13: "", grade_level: "" });
  const [grades, setGrades] = useState([]);

  const load = async () => {
    const m = await api.get("/municipalities"); setMunis(m.data);
    const s = await api.get(`/schools${selectedMun ? `?municipality_id=${selectedMun}` : ""}`); setSchools(s.data);
  };

  useEffect(() => { load(); api.get("/grade-levels").then((r) => setGrades(r.data)); /* eslint-disable-next-line */ }, [selectedMun]);

  const addMun = async () => {
    const name = prompt("Nome do concelho:");
    if (!name) return;
    await api.post("/admin/municipalities", { name }); toast.success("Concelho criado"); load();
  };
  const delMun = async (id) => {
    if (!confirm("Eliminar concelho e respetivas escolas?")) return;
    await api.delete(`/admin/municipalities/${id}`); toast.success("Eliminado"); load();
  };
  const addSchool = async () => {
    if (!selectedMun) { toast.error("Selecione primeiro um concelho"); return; }
    const name = prompt("Nome da escola:");
    if (!name) return;
    await api.post("/admin/schools", { name, municipality_id: selectedMun });
    toast.success("Escola criada"); load();
  };
  const delSchool = async (id) => {
    if (!confirm("Eliminar escola?")) return;
    await api.delete(`/admin/schools/${id}`); toast.success("Eliminada"); load();
  };

  const submitLink = async () => {
    try {
      await api.post("/admin/school-books", linkForm);
      toast.success("Livro associado à escola"); setLinkOpen(false);
    } catch (e) { toast.error(e.response?.data?.detail || "Erro"); }
  };

  return (
    <div className="p-8" data-testid="admin-schools">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-[10px] tracking-[0.2em] uppercase text-slate-500 font-semibold">Escolas</div>
          <h1 className="font-display text-3xl font-medium text-slate-900">Concelhos & Escolas</h1>
        </div>
        <Button onClick={() => setLinkOpen(true)} variant="outline" data-testid="link-school-book-btn"><LinkIcon className="w-4 h-4 mr-2"/>Associar livro</Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-medium">Concelhos</h2>
            <Button size="sm" onClick={addMun} className="bg-[#5A8F1E] hover:bg-[#3E6E11] text-white" data-testid="add-municipality-btn"><Plus className="w-3.5 h-3.5 mr-1"/>Novo</Button>
          </div>
          <div className="space-y-1">
            {munis.map((m) => (
              <div key={m.id} className={`flex items-center justify-between px-3 py-2 rounded hover:bg-slate-50 cursor-pointer ${selectedMun === m.id ? "bg-slate-100" : ""}`} onClick={() => setSelectedMun(m.id)} data-testid={`mun-${m.id}`}>
                <span className="text-sm">{m.name}</span>
                <button onClick={(e) => { e.stopPropagation(); delMun(m.id); }} className="text-slate-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5"/></button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-medium">Escolas {selectedMun && <span className="text-xs text-slate-500">· {munis.find(m=>m.id===selectedMun)?.name}</span>}</h2>
            <Button size="sm" onClick={addSchool} className="bg-[#5A8F1E] hover:bg-[#3E6E11] text-white" data-testid="add-school-btn"><Plus className="w-3.5 h-3.5 mr-1"/>Nova</Button>
          </div>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {schools.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-3 py-2 rounded hover:bg-slate-50">
                <span className="text-sm">{s.name}</span>
                <button onClick={() => delSchool(s.id)} className="text-slate-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5"/></button>
              </div>
            ))}
            {schools.length === 0 && <p className="text-sm text-slate-500 px-3 py-2">Nenhuma escola.</p>}
          </div>
        </div>
      </div>

      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Associar livro a escola</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div><Label>Escola</Label>
              <Select value={linkForm.school_id} onValueChange={(v)=>setLinkForm({...linkForm, school_id: v})}>
                <SelectTrigger><SelectValue placeholder="Selecionar..."/></SelectTrigger>
                <SelectContent>{schools.map((s)=><SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Ano de escolaridade</Label>
              <Select value={linkForm.grade_level} onValueChange={(v)=>setLinkForm({...linkForm, grade_level: v})}>
                <SelectTrigger><SelectValue placeholder="Selecionar..."/></SelectTrigger>
                <SelectContent>{grades.map((g)=><SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>ISBN-13</Label><Input value={linkForm.isbn13} onChange={(e)=>setLinkForm({...linkForm, isbn13: e.target.value})}/></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setLinkOpen(false)}>Cancelar</Button>
            <Button onClick={submitLink} className="bg-[#5A8F1E] hover:bg-[#3E6E11] text-white">Associar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
