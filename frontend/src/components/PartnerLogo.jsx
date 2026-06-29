import { useState } from "react";

// Fallback automático: se o URL do logo (ex: UI Avatars) falhar a carregar,
// usa um SVG local em /partners/{slug}.svg baseado no nome do parceiro.
const SLUG_MAP = {
  "academia do beira-mar": "/partners/beira-mar.svg",
  "academia vista alegre": "/partners/vista-alegre.svg",
  "iliabum clube": "/partners/iliabum.svg",
  "iliabum": "/partners/iliabum.svg",
  "beira-mar": "/partners/beira-mar.svg",
  "vista alegre": "/partners/vista-alegre.svg",
};

function getLocalLogo(name) {
  if (!name) return null;
  const key = String(name).toLowerCase().trim();
  if (SLUG_MAP[key]) return SLUG_MAP[key];
  for (const [k, v] of Object.entries(SLUG_MAP)) {
    if (key.includes(k)) return v;
  }
  return null;
}

export default function PartnerLogo({ partner, className = "" }) {
  const [failed, setFailed] = useState(false);
  const local = getLocalLogo(partner?.name);
  const src = failed || !partner?.logo_url ? local : partner.logo_url;

  if (!src) {
    const initials = String(partner?.name || "?").split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
    return (
      <div className={`grid place-items-center bg-[#5A8F1E] text-white font-display font-semibold ${className}`} aria-label={partner?.name}>
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={partner?.name || "Parceiro"}
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
