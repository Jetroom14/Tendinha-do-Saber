import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CoverImage } from "./CoverImage";
import { getBookKey } from "@/lib/bookKey";

export function StockBadge({ status }) {
  if (status === "PreOrder") return (
    <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider px-2 py-1 rounded bg-[#FFF8E1] text-[#8B5A00] border border-[#FFE082]" data-testid="stock-badge">
      <span className="stock-dot preorder"/> Pré-Venda
    </span>
  );
  if (status === "Unavailable") return (
    <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider px-2 py-1 rounded bg-[#FFF5F5] text-[#9B2C2C] border border-[#FED7D7]" data-testid="stock-badge">
      <span className="stock-dot unavailable"/> Indisponível
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider px-2 py-1 rounded bg-[#F0FFF4] text-[#22543D] border border-[#C6F6D5]" data-testid="stock-badge">
      <span className="stock-dot available"/> Em Stock
    </span>
  );
}

export function BookCard({ book, onAdd }) {
  const canBuy = book.status !== "Unavailable";
  const bookKey = getBookKey(book);
  return (
    <Link to={`/livro/${encodeURIComponent(bookKey)}`} className="book-card flex flex-col bg-white border border-[#E2E8F0] rounded-md overflow-hidden fade-up" data-testid={`book-card-${bookKey}`}>
      <div className="relative aspect-[3/4] bg-[#F5F8EC] overflow-hidden">
        <CoverImage book={book} className="w-full h-full object-cover" />
        <div className="absolute top-2 right-2"><StockBadge status={book.status}/></div>
        <span className="absolute top-2 left-2 text-[10px] uppercase tracking-wider px-2 py-1 rounded bg-[#5A8F1E] text-white">
          {book.type === "Workbook" ? "Caderno" : "Manual"}
        </span>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <div className="text-[10px] uppercase tracking-[0.18em] text-[#4A5568] mb-1">{book.subject || "Manual"}</div>
        <h3 className="font-display font-medium text-[15px] leading-snug text-[#1A202C] line-clamp-2 mb-1">{book.title}</h3>
        <div className="text-xs text-[#4A5568] mb-3">{book.publisher}</div>
        <div className="mt-auto flex items-end justify-between gap-2">
          <span className="font-display text-lg text-[#1A202C]">{book.price?.toFixed(2)}€</span>
          {canBuy && onAdd && (
            <Button
              size="sm"
              type="button"
              onClick={(e) => { e.preventDefault(); onAdd(book); }}
              className="bg-[#5A8F1E] hover:bg-[#3E6E11] text-white text-xs h-8 px-3"
              data-testid={`add-to-cart-${bookKey}`}
            >
              Adicionar
            </Button>
          )}
        </div>
      </div>
    </Link>
  );
}
