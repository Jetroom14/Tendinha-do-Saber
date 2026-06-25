import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Copy, Check, Palette } from "lucide-react";
import { toast } from "sonner";

const ASSETS = [
  {
    id: "color",
    label: "Logótipo principal (cor)",
    file: "/logo.svg",
    description: "Versão a cores — para fundos brancos e claros. Use em emails, faturas, cartazes e website.",
    bg: "#FFFFFF",
    invert: false,
  },
  {
    id: "mono",
    label: "Monocromático (preto)",
    file: "/logo-mono.svg",
    description: "Versão para impressão a uma cor, carimbos, faxes e situações onde a cor não está disponível.",
    bg: "#F5F8EC",
    invert: false,
  },
  {
    id: "white",
    label: "Versão branca",
    file: "/logo-white.svg",
    description: "Para fundos escuros ou imagens. Use em vinis, t-shirts pretas e posts de social media com fundo escuro.",
    bg: "#0F1F2E",
    invert: true,
  },
  {
    id: "favicon",
    label: "Favicon (32×32)",
    file: "/favicon.svg",
    description: "Ícone do separador do navegador. Versão simplificada otimizada para tamanhos pequenos.",
    bg: "#FFFFFF",
    invert: false,
  },
  {
    id: "raster",
    label: "Logótipo original (JPEG)",
    file: "/logo.jpeg",
    description: "Versão raster fornecida pelo cliente. Recomendado usar as versões SVG (escaláveis) sempre que possível.",
    bg: "#FFFFFF",
    invert: false,
  },
];

const PALETTE = [
  { name: "Verde Principal", hex: "#A5C937", role: "Interior do livro / acento" },
  { name: "Verde Escuro", hex: "#5A8F1E", role: "Botões primários, links" },
  { name: "Verde Hover", hex: "#3E6E11", role: "Estado hover de botões" },
  { name: "Verde Borda", hex: "#A5BD5B", role: "Arcos circulares do logótipo" },
  { name: "Preto Logo", hex: "#0B0B0B", role: "Telhado / capa do livro" },
  { name: "Laranja Acento", hex: "#E07A1F", role: "CTAs secundários (promoções)" },
  { name: "Cinza Fumo", hex: "#BCC0C2", role: "Detalhes (fumo, secundários)" },
  { name: "Bege Suave", hex: "#F5F8EC", role: "Fundos suaves" },
];

export default function AdminBrand() {
  const [copied, setCopied] = useState("");

  const copyHex = async (hex) => {
    await navigator.clipboard.writeText(hex);
    setCopied(hex);
    toast.success(`${hex} copiado`);
    setTimeout(() => setCopied(""), 1500);
  };

  const download = (file) => {
    const a = document.createElement("a");
    a.href = file;
    a.download = file.split("/").pop();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Download iniciado");
  };

  return (
    <div className="p-8 max-w-6xl" data-testid="admin-brand">
      <div className="mb-8">
        <div className="text-[10px] tracking-[0.2em] uppercase text-slate-500 font-semibold">Identidade Visual</div>
        <h1 className="font-display text-3xl font-medium text-slate-900">Brand Assets</h1>
        <p className="text-sm text-slate-600 mt-2 max-w-2xl">
          Recursos visuais da marca para partilha com parceiros, imprensa e materiais físicos. Todas as versões SVG são vetoriais — escalam sem perda de qualidade.
        </p>
      </div>

      {/* Logo variants */}
      <section className="mb-12">
        <h2 className="font-display text-lg font-medium text-slate-900 mb-4 flex items-center gap-2">
          <Palette className="w-4 h-4 text-[#5A8F1E]" strokeWidth={1.5}/> Variantes do logótipo
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ASSETS.map((a) => (
            <div key={a.id} className="bg-white border border-slate-200 rounded overflow-hidden" data-testid={`asset-${a.id}`}>
              <div className="aspect-square grid place-items-center p-8" style={{ backgroundColor: a.bg }}>
                <img src={a.file} alt={a.label} className="max-w-full max-h-full object-contain" style={{ width: "70%" }}/>
              </div>
              <div className="p-4">
                <h3 className="font-display font-medium text-sm text-slate-900 mb-1">{a.label}</h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-3">{a.description}</p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => download(a.file)} className="bg-[#5A8F1E] hover:bg-[#3E6E11] text-white h-8 px-3 text-xs flex-1" data-testid={`download-${a.id}`}>
                    <Download className="w-3.5 h-3.5 mr-1.5" strokeWidth={1.5}/> Descarregar
                  </Button>
                  <a href={a.file} target="_blank" rel="noreferrer" className="text-xs px-3 h-8 grid place-items-center border border-slate-300 rounded hover:bg-slate-50" data-testid={`view-${a.id}`}>Ver</a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Color palette */}
      <section className="mb-12">
        <h2 className="font-display text-lg font-medium text-slate-900 mb-4">Paleta de cores</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {PALETTE.map((c) => (
            <button
              key={c.hex}
              onClick={() => copyHex(c.hex)}
              className="bg-white border border-slate-200 rounded overflow-hidden hover:border-[#5A8F1E] transition-colors text-left"
              data-testid={`color-${c.hex.replace('#', '')}`}
            >
              <div className="aspect-[4/3]" style={{ backgroundColor: c.hex }}/>
              <div className="p-3">
                <div className="font-display font-medium text-sm text-slate-900">{c.name}</div>
                <div className="flex items-center justify-between mt-1">
                  <code className="text-xs font-mono text-slate-600">{c.hex}</code>
                  {copied === c.hex ? <Check className="w-3.5 h-3.5 text-emerald-600"/> : <Copy className="w-3.5 h-3.5 text-slate-400"/>}
                </div>
                <div className="text-[11px] text-slate-500 mt-1.5 leading-snug">{c.role}</div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Typography */}
      <section className="mb-12">
        <h2 className="font-display text-lg font-medium text-slate-900 mb-4">Tipografia</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded p-6">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-3">Display · Títulos</div>
            <div className="font-display text-3xl text-slate-900 mb-2">Outfit</div>
            <div className="text-xs text-slate-500">Pesos 300–700 · Google Fonts</div>
          </div>
          <div className="bg-white border border-slate-200 rounded p-6">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-3">Body · Corpo de texto</div>
            <div className="font-body text-xl text-slate-900 mb-2">IBM Plex Sans</div>
            <div className="text-xs text-slate-500">Pesos 300–600 · Google Fonts</div>
          </div>
          <div className="bg-white border border-slate-200 rounded p-6">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-3">Serif · Destaques editoriais</div>
            <div className="font-serif text-3xl italic text-slate-900 mb-2">Cormorant</div>
            <div className="text-xs text-slate-500">Itálico · Google Fonts</div>
          </div>
        </div>
      </section>

      {/* Usage guide */}
      <section>
        <h2 className="font-display text-lg font-medium text-slate-900 mb-4">Diretrizes de uso</h2>
        <div className="bg-[#F5F8EC] border border-slate-200 rounded p-6 space-y-3 text-sm text-slate-700">
          <p><strong>✅ Faça:</strong> Use sempre a versão SVG sempre que possível. Mantenha um espaço em branco mínimo à volta do logótipo (1/4 da sua altura). Use a versão branca em fundos escuros.</p>
          <p><strong>❌ Não faça:</strong> Esticar, rodar ou alterar as cores do logótipo. Não aplicar sombras ou efeitos. Não colocar a versão a cores sobre fundos coloridos saturados.</p>
        </div>
      </section>
    </div>
  );
}
