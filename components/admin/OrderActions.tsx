"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { currency } from "@/components/admin/ui";

type Kind = "pay" | "cancel";

/**
 * Ações de um pedido pendente: confirmar pagamento ou cancelar. As duas são
 * definitivas (pagar desconta estoque e avisa o cliente), então pedem
 * confirmação. O servidor também recusa se o pedido não estiver mais pendente.
 */
export function OrderActions({ orderId, total, customerName }: { orderId: string; total: number; customerName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState<Kind | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    if (!open) return;
    setLoading(true);
    setError(null);
    try {
      const res =
        open === "pay"
          ? await fetch(`/api/admin/orders/${orderId}/mark-paid`, { method: "POST" })
          : await fetch(`/api/admin/orders/${orderId}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Não foi possível concluir a ação");
      setOpen(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  function openDialog(kind: Kind) {
    setError(null);
    setOpen(kind);
  }

  return (
    <>
      <Button variant="secondary" onClick={() => openDialog("cancel")}>
        <X className="size-4" aria-hidden />
        Cancelar pedido
      </Button>
      <Button onClick={() => openDialog("pay")}>
        <CircleCheck className="size-4" aria-hidden />
        Marcar como pago
      </Button>

      <ConfirmDialog
        open={open === "pay"}
        title="Confirmar pagamento?"
        description={
          <>
            Confirme só se {customerName} já pagou {currency.format(total)}. O estoque dos produtos será descontado e o
            cliente recebe a confirmação no WhatsApp. Isso não pode ser desfeito por aqui.
          </>
        }
        confirmLabel="Sim, o cliente pagou"
        loading={loading}
        error={error}
        onConfirm={confirm}
        onClose={() => setOpen(null)}
      />
      <ConfirmDialog
        open={open === "cancel"}
        tone="danger"
        title="Cancelar este pedido?"
        description="O pedido deixa de ficar pendente e não poderá mais ser marcado como pago. Nenhum estoque é alterado."
        confirmLabel="Cancelar pedido"
        loading={loading}
        error={error}
        onConfirm={confirm}
        onClose={() => setOpen(null)}
      />
    </>
  );
}
