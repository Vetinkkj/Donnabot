"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StatusMessage } from "@/components/admin/page-ui";

const EMPTY = { currentPassword: "", newPassword: "", confirmPassword: "" };

export function ChangePasswordForm() {
  const [values, setValues] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | undefined>();
  const [saved, setSaved] = useState(false);

  function update(field: keyof typeof EMPTY, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(undefined);
    setFieldErrors(undefined);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Erro ao trocar a senha");
        if (json.issues) {
          setFieldErrors(Object.fromEntries(Object.entries(json.issues).map(([k, v]) => [k, (v as string[])[0]])));
        }
        return;
      }
      setValues(EMPTY);
      setSaved(true);
    } catch {
      setError("Erro de conexão ao trocar a senha");
    } finally {
      setSubmitting(false);
    }
  }

  const incomplete = !values.currentPassword || !values.newPassword || !values.confirmPassword;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <StatusMessage tone="error">{error}</StatusMessage>}
      {saved && <StatusMessage tone="success">Senha alterada. Use a nova senha no próximo login.</StatusMessage>}
      <Input
        label="Senha atual"
        type="password"
        autoComplete="current-password"
        value={values.currentPassword}
        onChange={(e) => update("currentPassword", e.target.value)}
        error={fieldErrors?.currentPassword}
        className="sm:max-w-sm"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Nova senha"
          type="password"
          autoComplete="new-password"
          value={values.newPassword}
          onChange={(e) => update("newPassword", e.target.value)}
          error={fieldErrors?.newPassword}
          hint="Mínimo de 8 caracteres."
        />
        <Input
          label="Repita a nova senha"
          type="password"
          autoComplete="new-password"
          value={values.confirmPassword}
          onChange={(e) => update("confirmPassword", e.target.value)}
          error={fieldErrors?.confirmPassword}
        />
      </div>
      <div>
        <Button type="submit" variant="secondary" loading={submitting} disabled={incomplete}>
          Alterar senha
        </Button>
      </div>
    </form>
  );
}
