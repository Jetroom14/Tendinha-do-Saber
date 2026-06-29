import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Plus, Trash2, Link as LinkIcon, Pencil, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function AdminSchools() {
  const [munis, setMunis] = useState([]);
  const [schools, setSchools] = useState([]);
  const [selectedMun, setSelectedMun] = useState("");
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkForm, setLinkForm] = useState({ school_id: "", isbn13: "", grade_level: "" });
  const [schoolDialogOpen, setSchoolDialogOpen] = useState(false);
  const [editingSchoolId, setEditingSchoolId] = useState("");
  const [schoolForm, setSchoolForm] = useState({ name: "", municipality_id: "", grades_taught: [] });
  const [grades, setGrades] = useState([]);
  const [wipeOpen, setWipeOpen] = useState(false);
  const [wipePhrase, setWipePhrase] = useState("");
  const [wipeFinalConfirm, setWipeFinalConfirm] = useState(false);
  const [wiping, setWiping] = useState(false);

  const load = async () => {
    const m = await api.get("/municipalities"); setMunis(m.data);
    const s = await api.get(`/schools${selectedMun ? `?municipality_id=${selectedMun}` : ""}`); setSchools(s.data);
  };

  useEffect(() => { load(); api.get("/grade-levels").then((r) => setGrades(r.data)); /* eslint-disable-next-line */ }, [selectedMun]);

  const resetSchoolForm = (school = null) => {
    if (school) {
      setEditingSchoolId(school.id);
      setSchoolForm({ name: school.name, municipality_id: school.municipality_id, grades_taught: school.grades_taught || [] });
    } else {
      setEditingSchoolId("");
      setSchoolForm({ name: "", municipality_id: selectedMun, grades_taught: [] });
    }
    setSchoolDialogOpen(true);
  };

  const addMun = async () => {
    const name = prompt("Nome do concelho:");
    if (!name) return;
    await api.post("/admin/municipalities", { name }); toast.success("Concelho criado"); load();
  };
  const delMun = async (id) => {
    if (!confirm("Eliminar concelho e respetivas escolas?")) return;
    await api.delete(`/admin/municipalities/${id}`); toast.success("Eliminado"); load();
  };
  const openNewSchoolDialog = () => {
    if (!selectedMun) { toast.error("Selecione primeiro um concelho"); return; }
    resetSchoolForm();
  };
  const editSchool = (school) => resetSchoolForm(school);
  const saveSchool = async () => {
    if (!schoolForm.name.trim()) { toast.error("Nome da escola é obrigatório"); return; }
    if (!schoolForm.municipality_id) { toast.error("Município inválido"); return; }
    if (schoolForm.grades_taught.length === 0) { toast.error("Selecione pelo menos um ano"); return; }
    try {
      if (editingSchoolId) {
        await api.put(`/admin/schools/${editingSchoolId}`, {
          name: schoolForm.name.trim(),
          municipality_id: schoolForm.municipality_id,
          grades_taught: schoolForm.grades_taught,
        });
        toast.success("Escola atualizada");
      } else {
        await api.post("/admin/schools", {
          name: schoolForm.name.trim(),
          municipality_id: schoolForm.municipality_id,
          grades_taught: schoolForm.grades_taught,
        });
        toast.success("Escola criada");
      }
      setSchoolDialogOpen(false);
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Erro");
    }
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

  const openWipeDialog = () => {
    setWipePhrase("");
    setWipeFinalConfirm(false);
    setWipeOpen(true);
  };

  const wipeAllSchools = async () => {
    if (wipePhrase.trim() !== "APAGAR TODAS" || !wipeFinalConfirm) return;
    setWiping(true);
    try {
      const fd = new FormData();
      fd.append("confirmation", "APAGAR TODAS");
      const { data } = await api.delete("/admin/schools", { data: fd, headers: { "Content-Type": "multipart/form-data" } });
      toast.success(`${data.schools_deleted} escolas e ${data.school_books_deleted} ligações apagadas.`);
      setWipeOpen(false);
      setWipePhrase("");
      setWipeFinalConfirm(false);
      setSelectedMun("");
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Erro ao apagar escolas");
    } finally { setWiping(false); }
  };

  return (
    <div className="p-8" data-testid="admin-schools">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-[10px] tracking-[0.2em] uppercase text-slate-500 font-semibold">Escolas</div>
          <h1 className="font-display text-3xl font-medium text-slate-900">Concelhos & Escolas</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={openWipeDialog} variant="outline" className="border-rose-300 text-rose-700 hover:bg-rose-50 hover:text-rose-800" data-testid="wipe-all-schools-btn">
            <Trash2 className="w-4 h-4 mr-2"/>Apagar todas as escolas
          </Button>
          <Button onClick={() => setLinkOpen(true)} variant="outline" data-testid="link-school-book-btn"><LinkIcon className="w-4 h-4 mr-2"/>Associar livro</Button>
        </div>
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
            <Button size="sm" onClick={openNewSchoolDialog} className="bg-[#5A8F1E] hover:bg-[#3E6E11] text-white" data-testid="add-school-btn"><Plus className="w-3.5 h-3.5 mr-1"/>Nova</Button>
          </div>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {schools.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-3 py-2 rounded hover:bg-slate-50">
                <div>
                  <div className="text-sm font-medium">{s.name}</div>
                  {s.grades_taught?.length > 0 && <div className="text-xs text-slate-500">{s.grades_taught.join(", ")}</div>}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => editSchool(s)} className="p-1.5 rounded hover:bg-slate-200" data-testid={`edit-school-${s.id}`}><Pencil className="w-3.5 h-3.5"/></button>
                  <button onClick={() => delSchool(s.id)} className="text-slate-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5"/></button>
                </div>
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

      <Dialog open={schoolDialogOpen} onOpenChange={setSchoolDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSchoolId ? "Editar escola" : "Nova escola"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Nome da escola</Label>
              <Input value={schoolForm.name} onChange={(e) => setSchoolForm({ ...schoolForm, name: e.target.value })} data-testid="school-name-input" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Anos que a escola ensina</Label>
                <div className="flex flex-wrap gap-2 text-xs">
                  <button type="button" onClick={() => setSchoolForm({ ...schoolForm, grades_taught: ["1.º Ano", "2.º Ano", "3.º Ano", "4.º Ano"] })} className="rounded bg-slate-100 px-2 py-1 hover:bg-slate-200">1.º Ciclo</button>
                  <button type="button" onClick={() => setSchoolForm({ ...schoolForm, grades_taught: ["5.º Ano", "6.º Ano", "7.º Ano", "8.º Ano", "9.º Ano"] })} className="rounded bg-slate-100 px-2 py-1 hover:bg-slate-200">2.º/3.º Ciclo</button>
                  <button type="button" onClick={() => setSchoolForm({ ...schoolForm, grades_taught: ["10.º Ano", "11.º Ano", "12.º Ano"] })} className="rounded bg-slate-100 px-2 py-1 hover:bg-slate-200">Secundário</button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {grades.map((grade) => (
                  <label key={grade} className="flex items-center gap-2 text-sm rounded border border-slate-200 p-2 hover:bg-slate-50">
                    <Checkbox checked={schoolForm.grades_taught.includes(grade)} onCheckedChange={(checked) => {
                      const selected = new Set(schoolForm.grades_taught);
                      if (checked) selected.add(grade); else selected.delete(grade);
                      setSchoolForm({ ...schoolForm, grades_taught: Array.from(selected).sort((a, b) => grades.indexOf(a) - grades.indexOf(b)) });
                    }} />
                    <span>{grade}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSchoolDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveSchool} className="bg-[#5A8F1E] hover:bg-[#3E6E11] text-white" data-testid="save-school-btn">
              {editingSchoolId ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Apagar TODAS as escolas (confirmação dupla) */}
      <Dialog open={wipeOpen} onOpenChange={(o) => { setWipeOpen(o); if (!o) { setWipePhrase(""); setWipeFinalConfirm(false); } }}>
        <DialogContent data-testid="wipe-dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-700">
              <AlertTriangle className="w-5 h-5"/> Apagar todas as escolas
            </DialogTitle>
            <DialogDescription className="text-slate-600 pt-2">
              Esta ação é <strong>irreversível</strong>. Vai eliminar <strong>todas as escolas</strong> e também todas as <strong>ligações livro ↔ escola</strong> existentes.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 space-y-4">
            <div className="bg-rose-50 border border-rose-200 rounded p-3 text-sm text-rose-900 space-y-1">
              <div className="font-semibold">O que vai ser apagado:</div>
              <ul className="list-disc list-inside text-xs space-y-0.5">
                <li>Todas as escolas (coleção <code className="bg-rose-100 px-1 rounded">schools</code>)</li>
                <li>Todas as ligações livro↔escola (coleção <code className="bg-rose-100 px-1 rounded">school_books</code>)</li>
              </ul>
              <div className="font-semibold pt-2">O que <em>NÃO</em> será tocado:</div>
              <ul className="list-disc list-inside text-xs space-y-0.5">
                <li>Concelhos, livros, encomendas, vouchers, clientes, parceiros, definições</li>
              </ul>
            </div>

            <div>
              <Label htmlFor="wipe-phrase" className="text-xs uppercase tracking-wider text-slate-500 mb-1.5 block">
                Para confirmar, escreva exatamente: <code className="bg-slate-100 px-1 rounded font-mono">APAGAR TODAS</code>
              </Label>
              <Input
                id="wipe-phrase"
                value={wipePhrase}
                onChange={(e) => setWipePhrase(e.target.value)}
                placeholder="APAGAR TODAS"
                className={`font-mono ${wipePhrase && wipePhrase.trim() !== "APAGAR TODAS" ? "border-rose-400" : ""}`}
                autoComplete="off"
                data-testid="wipe-phrase-input"
              />
            </div>

            <label className="flex items-start gap-2 cursor-pointer">
              <Checkbox
                checked={wipeFinalConfirm}
                onCheckedChange={(v) => setWipeFinalConfirm(!!v)}
                data-testid="wipe-final-confirm"
              />
              <span className="text-sm text-slate-700">
                Compreendo que esta ação é <strong>irreversível</strong> e que vou ter de reimportar o Excel para repor as escolas.
              </span>
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setWipeOpen(false)} disabled={wiping} data-testid="wipe-cancel-btn">Cancelar</Button>
            <Button
              onClick={wipeAllSchools}
              disabled={wipePhrase.trim() !== "APAGAR TODAS" || !wipeFinalConfirm || wiping}
              className="bg-rose-600 hover:bg-rose-700 text-white disabled:bg-slate-300"
              data-testid="wipe-confirm-btn"
            >
              <Trash2 className="w-4 h-4 mr-2"/>{wiping ? "A apagar..." : "Apagar TODAS as escolas"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
