import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { StockBadge } from "@/components/BookCard";
import { ArrowLeft, Heart, ShoppingBag, Truck, ShieldCheck } from "lucide-react";

export default function BookDetailPage() {
  const { isbn13 } = useParams();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const { add } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    api.get(`/books/${isbn13}`)
      .then((r) => setBook(r.data))
      .catch(() => setBook(null))
      .finally(() => setLoading(false));
  }, [isbn13]);

  const addToCart = () => {
    add(book.isbn13);
    toast.success("Adicionado ao carrinho");
  };

  const addToWishlist = async () => {
    if (!user) { toast.error("Inicie sessão para usar favoritos"); return; }
    await api.post("/wishlist", { isbn13: book.isbn13 });
    toast.success("Adicionado aos favoritos");
  };

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-20 text-center text-[#4A5568]" data-testid="book-loading">A carregar...</div>;
  if (!book) return <div className="max-w-7xl mx-auto px-4 py-20 text-center" data-testid="book-not-found">
    <p className="text-[#4A5568] mb-4">Livro não encontrado.</p>
    <Link to="/catalogo" className="text-[#5A8F1E] hover:underline">Voltar ao catálogo</Link>
  </div>;

  const canBuy = book.status !== "Unavailable";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" data-testid="book-detail-page">
      <Link to="/catalogo" className="inline-flex items-center gap-1.5 text-sm text-[#4A5568] hover:text-[#5A8F1E] mb-8" data-testid="back-to-catalog">
        <ArrowLeft className="w-4 h-4" strokeWidth={1.5}/> Voltar ao catálogo
      </Link>

      <div className="grid md:grid-cols-12 gap-12">
        <div className="md:col-span-5">
          <div className="sticky top-28 bg-[#F5F8EC] rounded-md aspect-[3/4] overflow-hidden border border-[#E2E8F0]">
            {book.image_url ? (
              <img src={book.image_url} alt={book.title} className="w-full h-full object-cover" data-testid="book-cover-img"/>
            ) : (
              <div className="w-full h-full grid place-items-center font-serif italic text-[#4A5568] text-6xl">{book.title?.[0]}</div>
            )}
          </div>
        </div>

        <div className="md:col-span-7">
          <div className="flex items-center gap-2 mb-3">
            <StockBadge status={book.status}/>
            {book.type === "Workbook" && (
              <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded bg-[#5A8F1E] text-white">Caderno de Fichas</span>
            )}
          </div>
          <div className="text-[10px] tracking-[0.2em] uppercase text-[#4A5568] font-semibold mb-2">{book.subject}</div>
          <h1 className="font-display text-3xl md:text-4xl font-medium text-[#1A202C] leading-tight mb-3" data-testid="book-title">{book.title}</h1>
          <div className="text-[#4A5568] mb-6">{book.author} · {book.publisher}</div>

          <div className="font-display text-4xl text-[#1A202C] mb-8" data-testid="book-price">{book.price?.toFixed(2)}€</div>

          {book.synopsis && (
            <div className="mb-8">
              <h2 className="text-[10px] tracking-[0.2em] uppercase text-[#4A5568] font-semibold mb-2">Sinopse</h2>
              <p className="font-serif text-lg italic text-[#1A202C] leading-relaxed">{book.synopsis}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <Button onClick={addToCart} disabled={!canBuy} className="bg-[#5A8F1E] hover:bg-[#3E6E11] text-white h-12 px-6 flex-1" data-testid="add-to-cart-detail-btn">
              <ShoppingBag className="w-4 h-4 mr-2" strokeWidth={1.5}/> {canBuy ? "Adicionar ao carrinho" : "Indisponível"}
            </Button>
            <Button variant="outline" onClick={addToWishlist} className="h-12 px-6 border-[#5A8F1E] text-[#5A8F1E] hover:bg-[#5A8F1E] hover:text-white" data-testid="wishlist-btn">
              <Heart className="w-4 h-4 mr-2" strokeWidth={1.5}/> Favoritos
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-8">
            <div className="flex items-start gap-3 p-4 bg-white border border-[#E2E8F0] rounded-md">
              <Truck className="w-5 h-5 text-[#5A8F1E] mt-0.5" strokeWidth={1.5}/>
              <div>
                <div className="font-display font-medium text-sm">Entrega em Mão</div>
                <div className="text-xs text-[#4A5568]">Para códigos postais de Aveiro</div>
              </div>
            </div>
            {book.is_lamination_eligible && (
              <div className="flex items-start gap-3 p-4 bg-white border border-[#E2E8F0] rounded-md">
                <ShieldCheck className="w-5 h-5 text-[#5A8F1E] mt-0.5" strokeWidth={1.5}/>
                <div>
                  <div className="font-display font-medium text-sm">Plastificação +2€</div>
                  <div className="text-xs text-[#4A5568]">Opcional no carrinho</div>
                </div>
              </div>
            )}
          </div>

          <div>
            <h2 className="text-[10px] tracking-[0.2em] uppercase text-[#4A5568] font-semibold mb-3">Ficha técnica</h2>
            <dl className="grid grid-cols-2 gap-y-2 text-sm border-t border-[#E2E8F0] pt-4">
              <dt className="text-[#4A5568]">ISBN-13</dt><dd className="font-mono text-[#1A202C]">{book.isbn13}</dd>
              <dt className="text-[#4A5568]">Editora</dt><dd className="text-[#1A202C]">{book.publisher || "—"}</dd>
              <dt className="text-[#4A5568]">Ano</dt><dd className="text-[#1A202C]">{book.year || "—"}</dd>
              <dt className="text-[#4A5568]">Disciplina</dt><dd className="text-[#1A202C]">{book.subject || "—"}</dd>
              <dt className="text-[#4A5568]">Tipo</dt><dd className="text-[#1A202C]">{book.type === "Workbook" ? "Caderno de Fichas" : "Manual"}</dd>
              <dt className="text-[#4A5568]">Stock</dt><dd className="text-[#1A202C]">{book.stock_qty} unidades</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
