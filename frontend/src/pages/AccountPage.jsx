import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { getBookKey } from "@/lib/bookKey";
import { Button } from "@/components/ui/button";
import { Heart, User } from "lucide-react";
import { toast } from "sonner";
import ChangePasswordForm from "@/components/ChangePasswordForm";

export default function AccountPage() {
  const { user, logout } = useAuth();
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    if (user) api.get("/wishlist").then((r) => setWishlist(r.data));
  }, [user]);

  const removeFav = async (isbn) => {
    await api.delete(`/wishlist/${isbn}`);
    setWishlist((cur) => cur.filter((b) => b.isbn13 !== isbn));
    toast.success("Removido dos favoritos");
  };

  if (!user) return (
    <div className="max-w-md mx-auto px-4 py-20 text-center" data-testid="account-guard">
      <p className="text-[#4A5568] mb-4">Precisa de iniciar sessão.</p>
      <Link to="/login"><Button className="bg-[#5A8F1E] hover:bg-[#3E6E11]">Entrar</Button></Link>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12" data-testid="account-page">
      <div className="flex items-center justify-between mb-10">
        <div>
          <div className="text-[10px] tracking-[0.2em] uppercase text-[#4A5568] font-semibold mb-1">A minha conta</div>
          <h1 className="font-display text-3xl md:text-4xl font-medium">Olá, {user.name?.split(" ")[0]}</h1>
        </div>
        <Button variant="outline" onClick={logout} data-testid="account-logout">Sair</Button>
      </div>

      <div className="grid md:grid-cols-12 gap-8">
        <aside className="md:col-span-4">
          <div className="bg-white border border-[#E2E8F0] rounded-md p-6 space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#F5F8EC] grid place-items-center"><User className="w-5 h-5 text-[#5A8F1E]" strokeWidth={1.5}/></div>
            <div className="text-sm">
              <div className="text-[10px] uppercase tracking-wider text-[#4A5568]">Nome</div>
              <div className="font-medium">{user.name}</div>
            </div>
            <div className="text-sm">
              <div className="text-[10px] uppercase tracking-wider text-[#4A5568]">Email</div>
              <div className="font-medium">{user.email}</div>
            </div>
            <div className="text-sm">
              <div className="text-[10px] uppercase tracking-wider text-[#4A5568]">Tipo de conta</div>
              <div className="font-medium capitalize">{user.role.replace("_", " ")}</div>
            </div>
          </div>
        </aside>

        <section className="md:col-span-8">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-5 h-5 text-[#E07A1F]" strokeWidth={1.5}/>
            <h2 className="font-display text-xl font-medium">Os meus favoritos</h2>
          </div>
          {wishlist.length === 0 ? (
            <div className="bg-white border border-[#E2E8F0] rounded-md p-8 text-center text-[#4A5568]" data-testid="wishlist-empty">Ainda não tem favoritos.</div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {wishlist.map((b) => (
                <div key={b.isbn13} className="bg-white border border-[#E2E8F0] rounded-md p-4 flex gap-3" data-testid={`fav-${b.isbn13}`}>
                  <div className="w-16 h-20 bg-[#F5F8EC] rounded overflow-hidden shrink-0">
                    {b.image_url && <img src={b.image_url} alt="" className="w-full h-full object-cover"/>}
                  </div>
                  <div className="flex-1">
                    <Link to={`/livro/${encodeURIComponent(getBookKey(b))}`} className="font-display font-medium text-sm hover:text-[#5A8F1E] line-clamp-2">{b.title}</Link>
                    <div className="text-xs text-[#4A5568]">{b.publisher}</div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="font-display text-sm">{b.price.toFixed(2)}€</span>
                      <button onClick={() => removeFav(b.isbn13)} className="text-xs text-[#C53030] hover:underline">Remover</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-10 bg-white border border-[#E2E8F0] rounded-md p-8">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-5 h-5 text-[#5A8F1E]" strokeWidth={1.5}/>
              <h2 className="font-display text-xl font-medium">Alterar Password</h2>
            </div>
            <p className="mb-6 text-sm text-[#4A5568]">Atualize a sua password atualizando a password antiga para uma nova password de pelo menos 8 caracteres.</p>
            <ChangePasswordForm />
          </div>
        </section>
      </div>
    </div>
  );
}
