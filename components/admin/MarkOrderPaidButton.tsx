"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function MarkOrderPaidButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleMarkPaid() {
    if (!confirm("Confirmar que o cliente pagou? O estoque será descontado e o cliente recebe a confirmação no WhatsApp.")) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/mark-paid`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Erro ao marcar pedido como pago");
        return;
      }
      router.refresh();
    } catch {
      setError("Erro de conexão ao marcar pedido como pago");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button onClick={handleMarkPaid} disabled={loading}>
        {loading ? "Confirmando..." : "Marcar como pago"}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
