import { useState } from "react";
import api, { formatApiErrorDetail } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ChangePasswordForm({ className }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (newPassword.length < 8) {
      toast.error("A nova password deve ter pelo menos 8 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("A nova password e a confirmação não coincidem.");
      return;
    }

    try {
      setSubmitting(true);
      await api.post("/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password atualizada com sucesso.");
    } catch (error) {
      const message = formatApiErrorDetail(error.response?.data?.detail || error.response?.data);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className ? `${className} space-y-5` : "space-y-5"}>
      <div>
        <Label htmlFor="current-password">Password atual</Label>
        <Input
          id="current-password"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          autoComplete="current-password"
          data-testid="change-password-current"
        />
      </div>
      <div>
        <Label htmlFor="new-password">Nova password</Label>
        <Input
          id="new-password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
          data-testid="change-password-new"
        />
      </div>
      <div>
        <Label htmlFor="confirm-password">Confirmar nova password</Label>
        <Input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
          data-testid="change-password-confirm"
        />
      </div>
      <Button type="submit" disabled={submitting} className="bg-[#5A8F1E] hover:bg-[#3E6E11] text-white">
        {submitting ? "A actualizar..." : "Alterar Password"}
      </Button>
    </form>
  );
}
