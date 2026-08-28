import { useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link as LinkIcon,
  Undo2,
  Redo2,
  RemoveFormatting,
  Save,
  ExternalLink,
  Eye,
  PencilLine,
  Quote,
  Minus,
  Strikethrough,
} from "lucide-react";


/* ============================================================
   NORMALIZAÇÃO DO HTML

   O editor aceita apenas uma pequena linguagem visual própria.
   Conteúdo colado de ChatGPT, Word, Google Docs, etc. perde
   styles/classes/fontes externas antes de entrar no editor.

   Desta forma o aspecto antes/depois de guardar é consistente
   com a sanitização Bleach feita pelo backend.
   ============================================================ */

function normalizeTextKey(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}


function safeHref(value = "") {
  const href = String(value).trim();

  if (!href) return null;

  if (href.startsWith("/") || href.startsWith("#")) {
    return href;
  }

  const lowered = href.toLowerCase();

  if (
    lowered.startsWith("https://") ||
    lowered.startsWith("http://") ||
    lowered.startsWith("mailto:") ||
    lowered.startsWith("tel:")
  ) {
    return href;
  }

  return null;
}


function cleanChildren(source, targetDocument) {
  const fragment = targetDocument.createDocumentFragment();

  Array.from(source.childNodes || []).forEach((child) => {
    const cleaned = cleanNode(child, targetDocument);
    if (cleaned) fragment.appendChild(cleaned);
  });

  return fragment;
}


function cleanNode(source, targetDocument) {
  if (source.nodeType === Node.TEXT_NODE) {
    return targetDocument.createTextNode(source.textContent || "");
  }

  if (source.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }

  const tag = source.tagName.toUpperCase();

  // Elementos que nunca queremos importar nem sequer como texto.
  if (
    [
      "SCRIPT",
      "STYLE",
      "IFRAME",
      "OBJECT",
      "EMBED",
      "FORM",
      "INPUT",
      "BUTTON",
      "TEXTAREA",
      "SELECT",
      "OPTION",
      "META",
      "LINK",
      "SVG",
      "MATH",
      "CANVAS",
      "VIDEO",
      "AUDIO",
    ].includes(tag)
  ) {
    return null;
  }

  // Conversão de níveis de títulos externos para a hierarquia
  // usada nas páginas legais da Tendinha.
  const tagMap = {
    H1: "H2",
    H2: "H2",
    H3: "H3",
    H4: "H4",
    H5: "H4",
    H6: "H4",

    P: "P",

    STRONG: "STRONG",
    B: "STRONG",

    EM: "EM",
    I: "EM",

    U: "U",

    S: "S",
    DEL: "S",
    STRIKE: "S",

    UL: "UL",
    OL: "OL",
    LI: "LI",

    BLOCKQUOTE: "BLOCKQUOTE",

    BR: "BR",
    HR: "HR",

    CODE: "CODE",
    PRE: "PRE",

    A: "A",
  };

  const mappedTag = tagMap[tag];

  // DIV/SPAN/FONT e outros wrappers de aplicações externas:
  // retiramos o wrapper mas preservamos o conteúdo útil.
  if (!mappedTag) {
    return cleanChildren(source, targetDocument);
  }

  if (mappedTag === "BR" || mappedTag === "HR") {
    return targetDocument.createElement(mappedTag.toLowerCase());
  }

  if (mappedTag === "A") {
    const href = safeHref(source.getAttribute("href"));

    // Link inseguro: mantém o texto, remove o link.
    if (!href) {
      return cleanChildren(source, targetDocument);
    }

    const anchor = targetDocument.createElement("a");
    anchor.setAttribute("href", href);

    if (href.startsWith("http://") || href.startsWith("https://")) {
      anchor.setAttribute("target", "_blank");
      anchor.setAttribute("rel", "noopener noreferrer");
    }

    anchor.appendChild(cleanChildren(source, targetDocument));
    return anchor;
  }

  const element = targetDocument.createElement(mappedTag.toLowerCase());
  element.appendChild(cleanChildren(source, targetDocument));

  return element;
}


function removeLeadingWhitespace(container) {
  while (
    container.firstChild &&
    container.firstChild.nodeType === Node.TEXT_NODE &&
    !(container.firstChild.textContent || "").trim()
  ) {
    container.removeChild(container.firstChild);
  }
}


function normalizeLegalHtml(rawHtml = "", pageTitle = "") {
  if (!rawHtml) return "";

  const parser = new DOMParser();
  const source = parser.parseFromString(String(rawHtml), "text/html");
  const targetDocument = document.implementation.createHTMLDocument("");
  const container = targetDocument.createElement("div");

  Array.from(source.body.childNodes).forEach((node) => {
    const cleaned = cleanNode(node, targetDocument);
    if (cleaned) container.appendChild(cleaned);
  });

  removeLeadingWhitespace(container);

  // A página pública já apresenta automaticamente o nome da página.
  // Se o documento colado começar exatamente pelo mesmo título,
  // removemos essa duplicação.
  const first = container.firstElementChild;

  if (
    first &&
    ["H2", "H3", "H4", "P"].includes(first.tagName) &&
    normalizeTextKey(first.textContent) === normalizeTextKey(pageTitle)
  ) {
    first.remove();
    removeLeadingWhitespace(container);
  }

  return container.innerHTML.trim();
}


function plainTextToHtml(text = "") {
  const container = document.createElement("div");

  String(text)
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .forEach((block) => {
      const value = block.trim();

      if (!value) return;

      const p = document.createElement("p");
      const lines = value.split("\n");

      lines.forEach((line, index) => {
        if (index > 0) p.appendChild(document.createElement("br"));
        p.appendChild(document.createTextNode(line));
      });

      container.appendChild(p);
    });

  return container.innerHTML;
}


/* ============================================================
   EDITOR
   ============================================================ */

function exec(cmd, value = null) {
  document.execCommand(cmd, false, value);
}


function EditorToolbar({ editorRef, onChange }) {
  const btn =
    "p-2 min-w-[34px] h-9 rounded hover:bg-slate-200 text-slate-700 transition-colors grid place-items-center";

  const run = (cmd, value = null) => {
    editorRef.current?.focus();
    exec(cmd, value);
    onChange();
  };

  const insertLink = () => {
    const url = window.prompt("URL do link:");

    if (!url) return;

    const href = safeHref(url);

    if (!href) {
      toast.error("O endereço introduzido não é válido.");
      return;
    }

    run("createLink", href);
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-200 bg-slate-50 px-2 py-1.5 rounded-t">

      <button
        type="button"
        className={btn}
        onClick={() => run("formatBlock", "H2")}
        title="Título de secção"
        data-testid="legal-fmt-h2"
      >
        <Heading2 className="w-4 h-4"/>
      </button>

      <button
        type="button"
        className={btn}
        onClick={() => run("formatBlock", "H3")}
        title="Subtítulo"
        data-testid="legal-fmt-h3"
      >
        <Heading3 className="w-4 h-4"/>
      </button>

      <button
        type="button"
        className={btn}
        onClick={() => run("formatBlock", "H4")}
        title="Subtítulo pequeno"
        data-testid="legal-fmt-h4"
      >
        <span className="text-[11px] font-semibold">H4</span>
      </button>

      <button
        type="button"
        className={btn}
        onClick={() => run("formatBlock", "P")}
        title="Texto normal"
        data-testid="legal-fmt-p"
      >
        <span className="text-xs font-mono">P</span>
      </button>

      <span className="mx-1 h-6 border-r border-slate-300" />

      <button
        type="button"
        className={btn}
        onClick={() => run("bold")}
        title="Negrito (Ctrl+B)"
        data-testid="legal-fmt-bold"
      >
        <Bold className="w-4 h-4"/>
      </button>

      <button
        type="button"
        className={btn}
        onClick={() => run("italic")}
        title="Itálico (Ctrl+I)"
        data-testid="legal-fmt-italic"
      >
        <Italic className="w-4 h-4"/>
      </button>

      <button
        type="button"
        className={btn}
        onClick={() => run("underline")}
        title="Sublinhado (Ctrl+U)"
        data-testid="legal-fmt-underline"
      >
        <UnderlineIcon className="w-4 h-4"/>
      </button>

      <button
        type="button"
        className={btn}
        onClick={() => run("strikeThrough")}
        title="Rasurado"
        data-testid="legal-fmt-strike"
      >
        <Strikethrough className="w-4 h-4"/>
      </button>

      <span className="mx-1 h-6 border-r border-slate-300" />

      <button
        type="button"
        className={btn}
        onClick={() => run("insertUnorderedList")}
        title="Lista com marcadores"
        data-testid="legal-fmt-ul"
      >
        <List className="w-4 h-4"/>
      </button>

      <button
        type="button"
        className={btn}
        onClick={() => run("insertOrderedList")}
        title="Lista numerada"
        data-testid="legal-fmt-ol"
      >
        <ListOrdered className="w-4 h-4"/>
      </button>

      <button
        type="button"
        className={btn}
        onClick={() => run("formatBlock", "BLOCKQUOTE")}
        title="Citação / destaque"
        data-testid="legal-fmt-quote"
      >
        <Quote className="w-4 h-4"/>
      </button>

      <button
        type="button"
        className={btn}
        onClick={insertLink}
        title="Inserir link"
        data-testid="legal-fmt-link"
      >
        <LinkIcon className="w-4 h-4"/>
      </button>

      <button
        type="button"
        className={btn}
        onClick={() => run("insertHorizontalRule")}
        title="Linha separadora"
        data-testid="legal-fmt-hr"
      >
        <Minus className="w-4 h-4"/>
      </button>

      <span className="mx-1 h-6 border-r border-slate-300" />

      <button
        type="button"
        className={btn}
        onClick={() => run("removeFormat")}
        title="Limpar formatação"
        data-testid="legal-fmt-clear"
      >
        <RemoveFormatting className="w-4 h-4"/>
      </button>

      <button
        type="button"
        className={btn}
        onClick={() => run("undo")}
        title="Anular"
        data-testid="legal-fmt-undo"
      >
        <Undo2 className="w-4 h-4"/>
      </button>

      <button
        type="button"
        className={btn}
        onClick={() => run("redo")}
        title="Refazer"
        data-testid="legal-fmt-redo"
      >
        <Redo2 className="w-4 h-4"/>
      </button>
    </div>
  );
}


function RichTextEditor({
  initialHtml,
  onSave,
  testId,
  pageTitle,
}) {
  const editorRef = useRef(null);

  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [normalizedOldContent, setNormalizedOldContent] = useState(false);

  useEffect(() => {
    if (!editorRef.current || initialHtml === undefined) return;

    const original = initialHtml || "";
    const cleaned = normalizeLegalHtml(original, pageTitle);

    editorRef.current.innerHTML = cleaned;

    const changed = cleaned !== original.trim();

    setDirty(changed);
    setNormalizedOldContent(changed);
    setPreview(false);
    setPreviewHtml("");
  }, [initialHtml, pageTitle]);


  const handleChange = () => {
    setDirty(true);
    setNormalizedOldContent(false);
  };


  const handlePaste = (event) => {
    event.preventDefault();

    const html = event.clipboardData?.getData("text/html") || "";
    const plain = event.clipboardData?.getData("text/plain") || "";

    const sourceHtml = html || plainTextToHtml(plain);
    const cleaned = normalizeLegalHtml(sourceHtml, pageTitle);

    if (!cleaned) return;

    editorRef.current?.focus();
    exec("insertHTML", cleaned);

    setDirty(true);
    setNormalizedOldContent(false);
  };


  const prepareCurrentHtml = () => {
    const current = editorRef.current?.innerHTML || "";
    const cleaned = normalizeLegalHtml(current, pageTitle);

    if (editorRef.current && cleaned !== current) {
      editorRef.current.innerHTML = cleaned;
      setDirty(true);
    }

    return cleaned;
  };


  const togglePreview = () => {
    if (preview) {
      setPreview(false);
      return;
    }

    const cleaned = prepareCurrentHtml();
    setPreviewHtml(cleaned);
    setPreview(true);
  };


  const save = async () => {
    setSaving(true);

    try {
      const html = prepareCurrentHtml();

      await onSave(html);

      setDirty(false);
      setNormalizedOldContent(false);
      setPreviewHtml(html);
    } finally {
      setSaving(false);
    }
  };


  return (
    <div
      className="border border-slate-200 rounded bg-white overflow-hidden"
      data-testid={testId}
    >
      {!preview && (
        <EditorToolbar
          editorRef={editorRef}
          onChange={handleChange}
        />
      )}

      {preview ? (
        <div className="min-h-[350px] bg-white">
          <div className="px-4 py-2 bg-[#F5F8EC] border-b border-slate-200 flex items-center gap-2 text-xs text-[#3E6E11] font-medium">
            <Eye className="w-4 h-4"/>
            Pré-visualização
          </div>

          <div
            className="legal-content min-h-[350px] p-4 sm:p-6 text-[#1A202C] leading-relaxed"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </div>
      ) : (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleChange}
          onPaste={handlePaste}
          className="legal-content min-h-[350px] p-4 sm:p-5 focus:outline-none text-[#1A202C] leading-relaxed"
          data-testid={`${testId}-body`}
        />
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 px-3 py-3 bg-slate-50 rounded-b">

        <div className="min-w-0">
          {normalizedOldContent ? (
            <p className="text-xs text-amber-700">
              A formatação antiga foi normalizada. Guarda a página para aplicar a correção.
            </p>
          ) : dirty ? (
            <p className="text-xs text-amber-700">
              Alterações por guardar.
            </p>
          ) : (
            <p className="text-xs text-slate-500">
              O título principal da página é adicionado automaticamente. Usa H2, H3 e H4 para organizar o conteúdo.
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={togglePreview}
            className="w-full sm:w-auto"
            data-testid={`${testId}-preview`}
          >
            {preview ? (
              <>
                <PencilLine className="w-4 h-4 mr-2"/>
                Continuar a editar
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2"/>
                Pré-visualizar
              </>
            )}
          </Button>

          <Button
            onClick={save}
            disabled={!dirty || saving}
            className="w-full sm:w-auto bg-[#5A8F1E] hover:bg-[#3E6E11] text-white disabled:bg-slate-300"
            data-testid={`${testId}-save`}
          >
            <Save className="w-4 h-4 mr-2"/>
            {saving ? "A guardar…" : "Guardar"}
          </Button>
        </div>
      </div>
    </div>
  );
}


/* ============================================================
   PÁGINA ADMIN
   ============================================================ */

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);


  const savePage = async (slug, html) => {
    try {
      await api.put(`/admin/legal/${slug}`, {
        content_html: html,
      });

      toast.success("Página guardada");
      await load();
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
        "Erro ao guardar"
      );

      throw error;
    }
  };


  const current = pages.find((page) => page.slug === active);


  return (
    <div
      className="p-4 sm:p-6 lg:p-8 max-w-4xl"
      data-testid="admin-legal"
    >
      <div className="mb-6">
        <div className="text-[10px] tracking-[0.2em] uppercase text-slate-500 font-semibold">
          Legal
        </div>

        <h1 className="font-display text-3xl font-medium text-slate-900">
          Páginas Legais
        </h1>

        <p className="text-sm text-slate-600 mt-1">
          Edite o conteúdo das páginas de Privacidade, Termos, Cookies e RAL.
          As alterações ficam visíveis publicamente em{" "}
          <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">
            /legal/&#123;slug&#125;
          </code>.
        </p>
      </div>




      {loading ? (
        <div className="text-slate-500 p-6">
          A carregar…
        </div>
      ) : (
        <Tabs
          value={active}
          onValueChange={setActive}
        >
          <div className="legal-tabs-scroll -mx-4 sm:mx-0 px-4 sm:px-0 mb-6 overflow-x-auto overscroll-x-contain">
            <TabsList className="w-max min-w-full justify-start">
              {pages.map((page) => (
                <TabsTrigger
                  key={page.slug}
                  value={page.slug}
                  className="shrink-0 whitespace-nowrap px-4"
                  data-testid={`legal-tab-${page.slug}`}
                >
                  {page.title}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>


          {pages.map((page) => (
            <TabsContent
              key={page.slug}
              value={page.slug}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between mb-3">
                <div>
                  <h2 className="font-display text-xl font-medium text-slate-900">
                    {page.title}
                  </h2>

                  <p className="text-xs text-slate-500 mt-0.5">
                    URL pública:{" "}
                    <a
                      href={`/legal/${page.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#5A8F1E] hover:underline"
                    >
                      /legal/{page.slug}{" "}
                      <ExternalLink className="w-3 h-3 inline"/>
                    </a>

                    {page.updated_at && (
                      <span className="block sm:inline sm:ml-3 mt-1 sm:mt-0">
                        · Atualizado em{" "}
                        {new Date(page.updated_at).toLocaleString("pt-PT")}
                      </span>
                    )}
                  </p>
                </div>
              </div>


              {page.slug === active && (
                <RichTextEditor
                  initialHtml={current?.content_html || ""}
                  onSave={(html) => savePage(page.slug, html)}
                  testId={`legal-editor-${page.slug}`}
                  pageTitle={page.title}
                />
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
