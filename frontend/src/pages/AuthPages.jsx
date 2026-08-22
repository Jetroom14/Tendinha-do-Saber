import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { getRememberedEmail, setRememberedEmail, removeRememberedEmail } from "@/lib/storage";

export function LoginPage() {
  const [rememberEmail, setRememberEmail] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const next = new URLSearchParams(location.search).get("next") || "/minha-conta";

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setErr("");
    const res = await login(email, password, keepSignedIn);
    setLoading(false);
    if (res.ok) {
      if (rememberEmail) setRememberedEmail(email);
      else removeRememberedEmail();
      toast.success("Bem-vindo!");
      if (res.user?.role === "admin" || res.user?.role === "super_admin") navigate("/admin");
      else navigate(next);
    } else {
      setErr(res.error);
    }
  };

  useEffect(() => {
    const saved = getRememberedEmail();
    if (saved) {
      setEmail(saved);
      setRememberEmail(true);
    }
  }, []);

  return (
    <div className="min-h-[70vh] grid place-items-center px-4 py-12" data-testid="login-page">
      <div className="w-full max-w-md bg-white border border-[#E2E8F0] rounded-md p-8">
        <h1 className="font-display text-2xl font-medium mb-2">Entrar</h1>
        <p className="text-sm text-[#4A5568] mb-6">Aceda à sua conta para acompanhar encomendas e favoritos.</p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label className="text-xs uppercase tracking-wider text-[#4A5568] mb-1.5 block">Email</Label>
            <Input type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} data-testid="login-email"/>
          </div>
          <div className="flex items-start gap-3">
            <Checkbox checked={rememberEmail} onCheckedChange={(v) => setRememberEmail(!!v)} data-testid="remember-email-checkbox" />
            <Label className="text-sm text-[#1A202C] cursor-pointer">Lembrar o meu email</Label>
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider text-[#4A5568] mb-1.5 block">Palavra-passe</Label>
            <Input type="password" required value={password} onChange={(e)=>setPassword(e.target.value)} data-testid="login-password"/>
          </div>
          <div className="flex items-start gap-3">
            <Checkbox checked={keepSignedIn} onCheckedChange={(v) => setKeepSignedIn(!!v)} data-testid="keep-signed-in-checkbox" />
            <Label className="text-sm text-[#1A202C] cursor-pointer">Manter sessão iniciada</Label>
          </div>
          {err && <p className="text-sm text-[#C53030]" data-testid="login-error">{err}</p>}
          <Button type="submit" disabled={loading} className="w-full bg-[#5A8F1E] hover:bg-[#3E6E11] h-11" data-testid="login-submit">
            {loading ? "A entrar..." : "Entrar"}
          </Button>
        </form>
        <div className="text-sm text-center mt-6 text-[#4A5568]">
          Ainda não tem conta? <Link to="/registar" className="text-[#5A8F1E] hover:underline" data-testid="register-link">Criar conta</Link>
        </div>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const { register } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setErr("");
    const res = await register(form.name, form.email, form.password);
    setLoading(false);
    if (res.ok) { toast.success("Conta criada"); navigate("/minha-conta"); }
    else setErr(res.error);
  };

  return (
    <div className="min-h-[70vh] grid place-items-center px-4 py-12" data-testid="register-page">
      <div className="w-full max-w-md bg-white border border-[#E2E8F0] rounded-md p-8">
        <h1 className="font-display text-2xl font-medium mb-2">Criar conta</h1>
        <p className="text-sm text-[#4A5568] mb-6">Acompanhe encomendas, guarde favoritos e gira vouchers.</p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label className="text-xs uppercase tracking-wider text-[#4A5568] mb-1.5 block">Nome</Label>
            <Input required value={form.name} onChange={(e)=>setForm({...form, name: e.target.value})} data-testid="register-name"/>
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider text-[#4A5568] mb-1.5 block">Email</Label>
            <Input type="email" required value={form.email} onChange={(e)=>setForm({...form, email: e.target.value})} data-testid="register-email"/>
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider text-[#4A5568] mb-1.5 block">Palavra-passe</Label>
            <Input type="password" required minLength={6} value={form.password} onChange={(e)=>setForm({...form, password: e.target.value})} data-testid="register-password"/>
          </div>
          <p className="text-xs text-[#4A5568]">
            Ao criar uma conta, os seus dados serão tratados nos termos da <Link to="/legal/privacidade" className="text-[#5A8F1E] hover:underline">Política de Privacidade</Link>.
          </p>
          {err && <p className="text-sm text-[#C53030]" data-testid="register-error">{err}</p>}
          <Button type="submit" disabled={loading} className="w-full bg-[#5A8F1E] hover:bg-[#3E6E11] h-11" data-testid="register-submit">
            {loading ? "A criar..." : "Criar conta"}
          </Button>
        </form>
        <div className="text-sm text-center mt-6 text-[#4A5568]">
          Já tem conta? <Link to="/login" className="text-[#5A8F1E] hover:underline">Entrar</Link>
        </div>
      </div>
    </div>
  );
}
