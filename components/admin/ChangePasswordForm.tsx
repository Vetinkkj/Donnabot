"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const EMPTY = { currentPassword: "", newPassword: "", confirmPassword: "" };

export function ChangePasswordForm() {
  const [values, setValues] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | undefined>();
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  function update(field: keyof typeof EMPTY, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(undefined);
    setFieldErrors(undefined);
    setSavedAt(null);
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
      setSavedAt(new Date());
    } catch {
      setError("Erro de conexão ao trocar a senha");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Alterar senha</h2>
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">{error}</p>
      )}
      {savedAt && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-300">
          Senha alterada. Use a nova senha no próximo login.
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Input
          label="Senha atual"
          type="password"
          autoComplete="current-password"
          value={values.currentPassword}
          onChange={(e) => update("currentPassword", e.target.value)}
          error={fieldErrors?.currentPassword}
        />
        <Input
          label="Nova senha"
          type="password"
          autoComplete="new-password"
          value={values.newPassword}
          onChange={(e) => update("newPassword", e.target.value)}
          error={fieldErrors?.newPassword}
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
        <Button type="submit" disabled={submitting}>
          {submitting ? "Salvando..." : "Alterar senha"}
        </Button>
      </div>
    </form>
  );
}
