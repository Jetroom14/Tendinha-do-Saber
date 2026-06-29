import ChangePasswordForm from "@/components/ChangePasswordForm";

export default function AdminChangePassword() {
  return (
    <div className="p-8 max-w-3xl" data-testid="admin-change-password">
      <div className="mb-6">
        <div className="text-[10px] tracking-[0.2em] uppercase text-slate-500 font-semibold">Segurança</div>
        <h1 className="font-display text-3xl font-medium text-slate-900">Alterar Password</h1>
        <p className="mt-2 text-sm text-slate-600">Atualize a password da sua conta de administrador de forma segura.</p>
      </div>
      <div className="bg-white border border-slate-200 rounded-md p-8">
        <ChangePasswordForm />
      </div>
    </div>
  );
}
