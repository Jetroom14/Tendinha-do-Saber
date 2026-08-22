import { useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Bold, Italic, Underline as UnderlineIcon, Heading2, Heading3, List, ListOrdered,
  Link as LinkIcon, Undo2, Redo2, RemoveFormatting, Save, ExternalLink,
} from "lucide-react";

/**
 * Bloco D — Páginas Legais (Admin)
 * Editor rich-text minimalista baseado em contentEditable + document.execCommand.
 * Sem dependências externas — mantém o pacote leve. Formatação: H2/H3, bold,
 * itálico, sublinhado, listas (marcadores/numeradas), link, undo/redo, limpar
 * formatação. O conteúdo é sanitizado no servidor com bleach antes de gravar.
 */

// document.execCommand está deprecado mas continua a funcionar em todos os
// browsers modernos. É a via mais leve para um editor rico simples.
function exec(cmd, value = null) {
  document.execCommand(cmd, false, value);
}

function EditorToolbar({ editorRef, onChange }) {
  const btn = "p-2 rounded hover:bg-slate-200 text-slate-700 transition-colors";

  const run = (cmd, val) => {
    editorRef.current?.focus();
    exec(cmd, val);
    onChange();
  };

  const insertLink = () => {
    const url = prompt("URL do link:");
    if (url) run("createLink", url);
  };

  return (
    <div className="flex flex-wrap gap-0.5 border-b border-slate-200 bg-slate-50 px-2 py-1.5 rounded-t">
      <button type="button" className={btn} onClick={() => run("formatBlock", "H2")} title="Título" data-testid="legal-fmt-h2"><Heading2 className="w-4 h-4"/></button>
      <button type="button" className={btn} onClick={() => run("formatBlock", "H3")} title="Subtítulo" data-testid="legal-fmt-h3"><Heading3 className="w-4 h-4"/></button>
      <button type="button" className={btn} onClick={() => run("formatBlock", "P")} title="Parágrafo"><span className="text-xs font-mono">P</span></button>
      <span className="mx-1 border-r border-slate-300"></span>
      <button type="button" className={btn} onClick={() => run("bold")} title="Negrito (Ctrl+B)" data-testid="legal-fmt-bold"><Bold className="w-4 h-4"/></button>
      <button type="button" className={btn} onClick={() => run("italic")} title="Itálico (Ctrl+I)" data-testid="legal-fmt-italic"><Italic className="w-4 h-4"/></button>
      <button type="button" className={btn} onClick={() => run("underline")} title="Sublinhado (Ctrl+U)"><UnderlineIcon className="w-4 h-4"/></button>
      <span className="mx-1 border-r border-slate-300"></span>
      <button type="button" className={btn} onClick={() => run("insertUnorderedList")} title="Lista com marcadores" data-testid="legal-fmt-ul"><List className="w-4 h-4"/></button>
      <button type="button" className={btn} onClick={() => run("insertOrderedList")} title="Lista numerada" data-testid="legal-fmt-ol"><ListOrdered className="w-4 h-4"/></button>
      <button type="button" className={btn} onClick={insertLink} title="Inserir link"><LinkIcon className="w-4 h-4"/></button>
      <span className="mx-1 border-r border-slate-300"></span>
      <button type="button" className={btn} onClick={() => run("removeFormat")} title="Limpar formatação"><RemoveFormatting className="w-4 h-4"/></button>
      <button type="button" className={btn} onClick={() => run("undo")} title="Anular"><Undo2 className="w-4 h-4"/></button>
      <button type="button" className={btn} onClick={() => run("redo")} title="Refazer"><Redo2 className="w-4 h-4"/></button>
    </div>
  );
}

function RichTextEditor({ initialHtml, onSave, testId }) {
  const editorRef = useRef(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  // Só define o HTML inicial UMA vez, para não sobrescrever cada tecla do user
  useEffect(() => {
    if (editorRef.current && initialHtml !== undefined) {
      editorRef.current.innerHTML = initialHtml || "";
      setDirty(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialHtml]);

  const handleChange = () => setDirty(true);

  const save = async () => {
    setSaving(true);
    try {
      const html = editorRef.current?.innerHTML || "";
      await onSave(html);
      setDirty(false);
    } finally { setSaving(false); }
  };

  return (
    <div className="border border-slate-200 rounded bg-white" data-testid={testId}>
      <EditorToolbar editorRef={editorRef} onChange={handleChange}/>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleChange}
        onBlur={handleChange}
        className="legal-content min-h-[350px] p-5 focus:outline-none text-[#1A202C] leading-relaxed"
        data-testid={`${testId}-body`}
      />
      <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2 bg-slate-50 rounded-b">
        <span className="text-xs text-slate-500">
          Formate como quiser: títulos, listas, negrito, itálico. O conteúdo é sanitizado no servidor antes de gravar (bloqueia <code className="bg-slate-200 px-1 rounded">&lt;script&gt;</code> e eventos inline).
        </span>
        <Button
          onClick={save}
          disabled={!dirty || saving}
          className="bg-[#5A8F1E] hover:bg-[#3E6E11] text-white disabled:bg-slate-300"
          data-testid={`${testId}-save`}
        >
          <Save className="w-4 h-4 mr-2"/>{saving ? "A guardar…" : "Guardar"}
        </Button>
      </div>
    </div>
  );
}

export default function AdminLegal() {
  const [pages, setPages] = useState([]);
  const [active, setActive] = useState("privacidade");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/legal");
      setPages(data.pages || []);
    } catch {
      toast.error("Erro ao carregar páginas legais");
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const savePage = async (slug, html) => {
    try {
      await api.put(`/admin/legal/${slug}`, { content_html: html });
      toast.success("Página guardada");
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Erro ao guardar");
    }
  };

  const current = pages.find((p) => p.slug === active);

  return (
    <div className="p-8 max-w-4xl" data-testid="admin-legal">
      <div className="mb-6">
        <div className="text-[10px] tracking-[0.2em] uppercase text-slate-500 font-semibold">Legal</div>
        <h1 className="font-display text-3xl font-medium text-slate-900">Páginas Legais</h1>
        <p className="text-sm text-slate-600 mt-1">Edite o conteúdo das páginas de Privacidade, Termos, Cookies e RAL. As alterações ficam visíveis publicamente em <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">/legal/&#123;slug&#125;</code>.</p>
      </div>

      {loading ? (
        <div className="text-slate-500 p-6">A carregar…</div>
      ) : (
        <Tabs value={active} onValueChange={setActive}>
          <TabsList className="mb-6">
            {pages.map((p) => (
              <TabsTrigger key={p.slug} value={p.slug} data-testid={`legal-tab-${p.slug}`}>
                {p.title}
              </TabsTrigger>
            ))}
          </TabsList>

          {pages.map((p) => (
            <TabsContent key={p.slug} value={p.slug}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="font-display text-xl font-medium text-slate-900">{p.title}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    URL pública: <a href={`/legal/${p.slug}`} target="_blank" rel="noreferrer" className="text-[#5A8F1E] hover:underline">/legal/{p.slug} <ExternalLink className="w-3 h-3 inline"/></a>
                    {p.updated_at && <span className="ml-3">· Atualizado em {new Date(p.updated_at).toLocaleString("pt-PT")}</span>}
                  </p>
                </div>
              </div>
              {p.slug === active && (
                <RichTextEditor
                  initialHtml={current?.content_html || ""}
                  onSave={(html) => savePage(p.slug, html)}
                  testId={`legal-editor-${p.slug}`}
                />
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
