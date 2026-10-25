"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";

/**
 * Confirmação de ação importante (cancelar pedido, excluir produto…). Usa o
 * <dialog> nativo: foco preso no modal, Esc fecha e o fundo fica inerte.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  tone = "default",
  loading = false,
  error,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  tone?: "default" | "danger";
  loading?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(event) => {
        event.preventDefault();
        if (!loading) onClose();
      }}
      onClick={(event) => {
        // clique no fundo (fora do cartão) fecha
        if (event.target === ref.current && !loading) onClose();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-0 text-zinc-100 shadow-2xl shadow-black/60 backdrop:bg-black/60 backdrop:backdrop-blur-sm"
    >
      <div className="dash-enter p-6">
        <div className="flex gap-4">
          {tone === "danger" && (
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-red-500/10 text-red-400">
              <TriangleAlert className="size-5" aria-hidden />
            </span>
          )}
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-zinc-50">{title}</h2>
            <div className="mt-1.5 text-sm leading-relaxed text-zinc-400">{description}</div>
          </div>
        </div>
        {error && <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Voltar
          </Button>
          <Button variant={tone === "danger" ? "danger" : "primary"} onClick={onConfirm} loading={loading} autoFocus>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
