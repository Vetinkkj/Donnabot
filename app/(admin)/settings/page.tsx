import { getCurrentStoreId } from "@/lib/current-store";
import { getStoreSettings } from "@/services/store";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { Badge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

function providerBadge(envValue: string | undefined, realValue: string) {
  const isReal = envValue === realValue;
  return (
    <Badge tone={isReal ? "success" : "neutral"}>{isReal ? envValue : "mock (padrão)"}</Badge>
  );
}

export default async function SettingsPage() {
  const storeId = await getCurrentStoreId();
  const store = await getStoreSettings(storeId);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Configurações</h1>

      <SettingsForm
        initialData={{
          name: store.name,
          botName: store.botName,
          phone: store.phone,
          address: store.address,
          logoUrl: store.logoUrl,
          welcomeMessage: store.welcomeMessage,
          paymentMessage: store.paymentMessage,
          orderApprovedMessage: store.orderApprovedMessage,
          defaultMinStock: store.defaultMinStock,
        }}
      />

      <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">Integrações</h2>
        <p className="mb-3 text-xs text-zinc-500">
          Controladas por variáveis de ambiente (arquivo <code>.env</code>) — não têm campo aqui de propósito, pra
          nunca guardar chave de API no banco. Troque o valor e reinicie o servidor para aplicar.
        </p>
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-zinc-600 dark:text-zinc-400">WhatsApp (WHATSAPP_PROVIDER)</span>
            {providerBadge(process.env.WHATSAPP_PROVIDER, "meta")}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-600 dark:text-zinc-400">Pagamento (PAYMENT_PROVIDER)</span>
            {providerBadge(process.env.PAYMENT_PROVIDER, "mercadopago")}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-600 dark:text-zinc-400">IA (AI_PROVIDER)</span>
            {providerBadge(process.env.AI_PROVIDER, "openai")}
          </div>
        </div>
      </section>
    </div>
  );
}
