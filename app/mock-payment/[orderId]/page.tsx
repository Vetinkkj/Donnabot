import { notFound } from "next/navigation";
import { getCurrentStoreId } from "@/lib/current-store";
import { createPixCharge } from "@/services/payment";
import { Badge } from "@/components/ui/Badge";
import { ApproveButton } from "@/components/payment/ApproveButton";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const STATUS_LABEL: Record<string, { label: string; tone: "success" | "warning" | "danger" }> = {
  PENDING: { label: "Aguardando pagamento", tone: "warning" },
  PAID: { label: "Pago", tone: "success" },
  CANCELLED: { label: "Cancelado", tone: "danger" },
  EXPIRED: { label: "Expirado", tone: "danger" },
};

export default async function MockPaymentPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const storeId = await getCurrentStoreId();
  const result = await createPixCharge(storeId, orderId);

  if (!result) notFound();

  const { order, payment } = result;
  const status = STATUS_LABEL[order.status] ?? STATUS_LABEL.PENDING;

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center gap-4 bg-zinc-50 p-6 dark:bg-black">
      <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Pagamento via PIX — Pedido #{order.id.slice(-6).toUpperCase()}
      </h1>

      <Badge tone={status.tone}>{status.label}</Badge>

      <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{currency.format(Number(order.total))}</p>

      {payment?.qrCode && (
        // eslint-disable-next-line @next/next/no-img-element -- data URL gerado localmente, sem otimização de imagem necessária
        <img src={payment.qrCode} alt="QR Code do PIX" className="h-56 w-56 rounded-md border border-zinc-200 dark:border-zinc-800" />
      )}

      {payment?.copyPasteCode && (
        <div className="w-full">
          <p className="mb-1 text-xs font-medium text-zinc-500">PIX Copia e Cola</p>
          <code className="block w-full break-all rounded-md border border-zinc-200 bg-white p-2 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            {payment.copyPasteCode}
          </code>
        </div>
      )}

      <div className="w-full rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm text-zinc-700 dark:text-zinc-300">
            <span>
              {item.product.name} x{item.quantity}
            </span>
            <span>{currency.format(Number(item.subtotal))}</span>
          </div>
        ))}
      </div>

      {order.status === "PENDING" ? (
        <>
          <p className="text-center text-sm text-zinc-500">
            Isto é uma simulação — nenhum pagamento real acontece aqui. Clique abaixo para simular a aprovação, como se
            o gateway tivesse confirmado o PIX.
          </p>
          <ApproveButton orderId={order.id} />
        </>
      ) : (
        <p className="text-center text-sm text-zinc-500">
          Este pedido já não está mais aguardando pagamento.
        </p>
      )}
    </div>
  );
}
