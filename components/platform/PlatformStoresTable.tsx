"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export type PlatformStoreRow = {
  id: string;
  name: string;
  status: string;
  subscriptionExpiresAt: string | null;
  createdAt: string;
  ownerEmail: string | null;
  ownerName: string | null;
};

const STATUS_TONE: Record<string, "neutral" | "success" | "warning" | "danger"> = {
  PENDING: "warning",
  ACTIVE: "success",
  SUSPENDED: "danger",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Aguardando aprovação",
  ACTIVE: "Ativa",
  SUSPENDED: "Suspensa",
};

function isExpired(subscriptionExpiresAt: string | null): boolean {
  return Boolean(subscriptionExpiresAt && new Date(subscriptionExpiresAt).getTime() < Date.now());
}

function toDateInputValue(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function StoreRow({ store, onUpdated }: { store: PlatformStoreRow; onUpdated: (store: PlatformStoreRow) => void }) {
  const [expiresAt, setExpiresAt] = useState(toDateInputValue(store.subscriptionExpiresAt));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function patch(body: Record<string, unknown>) {
    setSaving(true);
    setError(undefined);
    try {
      const res = await fetch(`/api/platform/stores/${store.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Erro ao atualizar");
        return;
      }
      onUpdated({
        ...store,
        status: json.data.status,
        subscriptionExpiresAt: json.data.subscriptionExpiresAt,
      });
    } catch {
      setError("Erro de conexão");
    } finally {
      setSaving(false);
    }
  }

  const expired = isExpired(store.subscriptionExpiresAt);

  return (
    <tr className="border-b border-zinc-100 dark:border-zinc-800">
      <td className="px-3 py-3 align-top">
        <div className="font-medium text-zinc-900 dark:text-zinc-50">{store.name}</div>
        <div className="text-xs text-zinc-500">{store.ownerEmail ?? "sem dono cadastrado"}</div>
      </td>
      <td className="px-3 py-3 align-top">
        <Badge tone={STATUS_TONE[store.status] ?? "neutral"}>{STATUS_LABEL[store.status] ?? store.status}</Badge>
        {store.status === "ACTIVE" && expired && (
          <div className="mt-1">
            <Badge tone="danger">Validade vencida</Badge>
          </div>
        )}
      </td>
      <td className="px-3 py-3 align-top">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="w-auto"
          />
          <Button
            type="button"
            variant="secondary"
            disabled={saving}
            onClick={() => patch({ subscriptionExpiresAt: expiresAt ? new Date(`${expiresAt}T23:59:59`).toISOString() : null })}
          >
            Definir validade
          </Button>
        </div>
      </td>
      <td className="px-3 py-3 align-top">
        <div className="flex flex-wrap gap-2">
          {store.status !== "ACTIVE" && (
            <Button type="button" disabled={saving} onClick={() => patch({ status: "ACTIVE" })}>
              Aprovar
            </Button>
          )}
          {store.status !== "SUSPENDED" && (
            <Button type="button" variant="danger" disabled={saving} onClick={() => patch({ status: "SUSPENDED" })}>
              Suspender
            </Button>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </td>
    </tr>
  );
}

export function PlatformStoresTable({ initialStores }: { initialStores: PlatformStoreRow[] }) {
  const [stores, setStores] = useState(initialStores);

  function handleUpdated(updated: PlatformStoreRow) {
    setStores((prev) => prev.map((store) => (store.id === updated.id ? updated : store)));
  }

  if (stores.length === 0) {
    return <p className="text-sm text-zinc-500">Nenhuma loja cadastrada ainda.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800">
          <tr>
            <th className="px-3 py-2 font-medium">Loja</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium">Validade da assinatura</th>
            <th className="px-3 py-2 font-medium">Ações</th>
          </tr>
        </thead>
        <tbody>
          {stores.map((store) => (
            <StoreRow key={store.id} store={store} onUpdated={handleUpdated} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
