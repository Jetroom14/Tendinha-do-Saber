import { Link } from "react-router-dom";
import { useState } from "react";

// Themed CSS gradient fallback cover for books with no image.
export function CoverImage({ book, className = "" }) {
  const [failed, setFailed] = useState(false);
  const src = book.image_url;
  if (!src || failed) {
    const subj = book.subject || book.title || "";
    const initials = subj.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
    // Hash-based hue for variety
    let h = 0;
    for (const c of (book.isbn13 || book.title || "")) h = (h * 31 + c.charCodeAt(0)) % 360;
    const bg = `linear-gradient(135deg, hsl(${h} 35% 30%) 0%, hsl(${(h + 30) % 360} 30% 20%) 100%)`;
    return (
      <div className={`w-full h-full grid place-items-center text-white relative overflow-hidden ${className}`} style={{ background: bg }}>
        <div className="text-center px-3">
          <div className="font-serif italic text-4xl opacity-30 leading-none">"</div>
          <div className="font-display text-xs uppercase tracking-[0.18em] opacity-80 mt-1">{book.subject || "Manual Escolar"}</div>
          <div className="font-display font-medium text-sm mt-2 line-clamp-3 leading-tight">{book.title}</div>
          <div className="font-serif italic text-xs opacity-75 mt-2">{book.author || book.publisher || ""}</div>
        </div>
        {initials && <div className="absolute top-2 right-2 font-display font-semibold text-xs bg-white/15 rounded px-2 py-0.5">{initials}</div>}
      </div>
    );
  }
  return <img src={src} alt={book.title} className={className} loading="lazy" onError={() => setFailed(true)} />;
}
