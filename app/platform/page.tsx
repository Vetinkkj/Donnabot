import { listAllStoresForPlatformAdmin } from "@/services/store";
import { PlatformStoresTable } from "@/components/platform/PlatformStoresTable";

export const dynamic = "force-dynamic";

export default async function PlatformPage() {
  const rawStores = await listAllStoresForPlatformAdmin();
  // Datas viram string (ISO) antes de cruzar pro client component — mais
  // simples e explícito do que depender da serialização automática de Date.
  const stores = rawStores.map((store) => ({
    ...store,
    subscriptionExpiresAt: store.subscriptionExpiresAt ? store.subscriptionExpiresAt.toISOString() : null,
    createdAt: store.createdAt.toISOString(),
  }));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Lojas</h2>
        <p className="text-sm text-zinc-500">
          Aprove lojas novas depois de confirmar que assinaram, defina/estenda a validade, ou suspenda quem não está
          mais em dia. Loja fora de <code>ACTIVE</code> (ou com validade vencida) tem o painel bloqueado pro dono e a
          Donna para de responder no WhatsApp.
        </p>
      </div>
      <PlatformStoresTable initialStores={stores} />
    </div>
  );
}
