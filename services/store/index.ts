import { db } from "@/lib/db";
import type { StoreSettingsInput } from "@/lib/validations/store";

export async function getStoreSettings(storeId: string) {
  return db.store.findUniqueOrThrow({ where: { id: storeId } });
}

export async function updateStoreSettings(storeId: string, input: StoreSettingsInput) {
  return db.store.update({
    where: { id: storeId },
    data: {
      name: input.name,
      botName: input.botName,
      phone: input.phone || null,
      address: input.address || null,
      logoUrl: input.logoUrl || null,
      welcomeMessage: input.welcomeMessage,
      paymentMessage: input.paymentMessage,
      orderApprovedMessage: input.orderApprovedMessage,
      defaultMinStock: input.defaultMinStock,
    },
  });
}
