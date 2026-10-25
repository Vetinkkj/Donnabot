import { auth } from "@/auth";
import { getCurrentStoreId } from "@/lib/current-store";
import { getStoreIntegrationsStatus, getStoreSettings } from "@/services/store";
import { SettingsView } from "@/components/admin/SettingsView";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  const isPlatformAdmin = Boolean(session?.user?.isPlatformAdmin);
  const storeId = await getCurrentStoreId();
  const [store, integrationsStatus] = await Promise.all([getStoreSettings(storeId), getStoreIntegrationsStatus(storeId)]);

  const metaAppId = process.env.NEXT_PUBLIC_META_APP_ID;
  const metaConfigId = process.env.NEXT_PUBLIC_META_CONFIG_ID;
  const embeddedSignup = metaAppId && metaConfigId ? { appId: metaAppId, configId: metaConfigId } : undefined;

  return (
    <SettingsView
      storeSettings={{
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
      whatsapp={{ initialStatus: integrationsStatus, embeddedSignup, isPlatformAdmin }}
      userEmail={session?.user?.email ?? null}
      // Variáveis de ambiente do servidor: assunto do dono da plataforma, não do lojista. Só o NOME do provedor, nunca chaves.
      platform={
        isPlatformAdmin
          ? {
              whatsapp: process.env.WHATSAPP_PROVIDER ?? null,
              payment: process.env.PAYMENT_PROVIDER ?? null,
              ai: process.env.AI_PROVIDER ?? null,
            }
          : null
      }
    />
  );
}
