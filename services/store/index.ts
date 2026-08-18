import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { decryptSecret, encryptSecret } from "@/lib/crypto";
import type { StoreSettingsInput } from "@/lib/validations/store";
import type { ResolvedWhatsAppConfig } from "@/services/whatsapp";

// ---------------------------------------------------------------------------
// CADASTRO DE NOVA LOJA (multi-tenant) — dono escolhe o próprio e-mail/senha
// ---------------------------------------------------------------------------

export type CreateStoreWithOwnerInput = {
  storeName: string;
  ownerName: string;
  email: string;
  password: string;
};

/** Cria uma loja nova e o usuário dono dela (role OWNER) em uma única transação. */
export async function createStoreWithOwner(input: CreateStoreWithOwnerInput) {
  const existing = await db.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new Error("Já existe uma conta com esse e-mail");
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  return db.$transaction(async (tx) => {
    const store = await tx.store.create({ data: { name: input.storeName } });
    const user = await tx.user.create({
      data: {
        storeId: store.id,
        name: input.ownerName,
        email: input.email,
        passwordHash,
        role: "OWNER",
      },
    });
    return { store, user };
  });
}

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

// ---------------------------------------------------------------------------
// INTEGRAÇÃO WHATSAPP POR LOJA (multi-tenant)
// ---------------------------------------------------------------------------
// Quando a loja tem a própria integração configurada (whatsappProvider
// preenchido), ela sobrepõe as variáveis de ambiente globais — cada loja
// pode ter seu próprio número. Tokens/segredos ficam sempre criptografados
// no banco (ver lib/crypto.ts) e nunca são devolvidos em texto puro pro
// painel — só um status "configurado ou não".

type StoreWhatsAppFields = {
  whatsappProvider: string | null;
  whatsappPhoneNumberId: string | null;
  whatsappTokenEncrypted: string | null;
  twilioAccountSid: string | null;
  twilioAuthTokenEncrypted: string | null;
  twilioWhatsappNumber: string | null;
};

/** Resolve a config de WhatsApp a usar: credenciais da loja, ou fallback pras variáveis de ambiente globais. */
export function resolveStoreWhatsAppConfig(store: StoreWhatsAppFields): ResolvedWhatsAppConfig {
  if (store.whatsappProvider === "meta" && store.whatsappTokenEncrypted && store.whatsappPhoneNumberId) {
    return {
      provider: "meta",
      token: decryptSecret(store.whatsappTokenEncrypted),
      phoneNumberId: store.whatsappPhoneNumberId,
    };
  }

  if (
    store.whatsappProvider === "twilio" &&
    store.twilioAccountSid &&
    store.twilioAuthTokenEncrypted &&
    store.twilioWhatsappNumber
  ) {
    return {
      provider: "twilio",
      accountSid: store.twilioAccountSid,
      authToken: decryptSecret(store.twilioAuthTokenEncrypted),
      from: store.twilioWhatsappNumber,
    };
  }

  if (process.env.WHATSAPP_PROVIDER === "meta" && process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
    return { provider: "meta", token: process.env.WHATSAPP_TOKEN, phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID };
  }

  if (
    process.env.WHATSAPP_PROVIDER === "twilio" &&
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_WHATSAPP_NUMBER
  ) {
    return {
      provider: "twilio",
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      from: process.env.TWILIO_WHATSAPP_NUMBER,
    };
  }

  return { provider: "mock" };
}

/** Usado pelos webhooks pra descobrir de qual loja é a mensagem, a partir do número de telefone da Meta. */
export async function getStoreByWhatsappPhoneNumberId(phoneNumberId: string) {
  return db.store.findUnique({ where: { whatsappPhoneNumberId: phoneNumberId } });
}

/** Usado pelo webhook do Twilio pra descobrir de qual loja é a mensagem, a partir do número "To". */
export async function getStoreByTwilioNumber(twilioWhatsappNumber: string) {
  return db.store.findUnique({ where: { twilioWhatsappNumber } });
}

export type StoreIntegrationsStatus = {
  whatsappProvider: string | null;
  metaConfigured: boolean;
  whatsappPhoneNumberId: string | null;
  twilioConfigured: boolean;
  twilioWhatsappNumber: string | null;
};

/** Status pro painel Integrações — nunca devolve os valores criptografados, só se estão presentes. */
export async function getStoreIntegrationsStatus(storeId: string): Promise<StoreIntegrationsStatus> {
  const store = await db.store.findUniqueOrThrow({ where: { id: storeId } });
  return {
    whatsappProvider: store.whatsappProvider,
    metaConfigured: Boolean(store.whatsappTokenEncrypted && store.whatsappPhoneNumberId),
    whatsappPhoneNumberId: store.whatsappPhoneNumberId,
    twilioConfigured: Boolean(store.twilioAccountSid && store.twilioAuthTokenEncrypted),
    twilioWhatsappNumber: store.twilioWhatsappNumber,
  };
}

export type SaveMetaIntegrationInput = {
  token: string;
  phoneNumberId: string;
  businessAccountId?: string;
  appSecret?: string;
};

export async function saveMetaIntegration(storeId: string, input: SaveMetaIntegrationInput) {
  return db.store.update({
    where: { id: storeId },
    data: {
      whatsappProvider: "meta",
      whatsappPhoneNumberId: input.phoneNumberId,
      whatsappBusinessAccountId: input.businessAccountId || null,
      whatsappTokenEncrypted: encryptSecret(input.token),
      whatsappAppSecretEncrypted: input.appSecret ? encryptSecret(input.appSecret) : null,
      // uma loja usa um provider de WhatsApp por vez — limpa o outro
      twilioAccountSid: null,
      twilioAuthTokenEncrypted: null,
      twilioWhatsappNumber: null,
    },
  });
}

export type SaveTwilioIntegrationInput = {
  accountSid: string;
  authToken: string;
  whatsappNumber: string;
};

export async function saveTwilioIntegration(storeId: string, input: SaveTwilioIntegrationInput) {
  return db.store.update({
    where: { id: storeId },
    data: {
      whatsappProvider: "twilio",
      twilioAccountSid: input.accountSid,
      twilioAuthTokenEncrypted: encryptSecret(input.authToken),
      twilioWhatsappNumber: input.whatsappNumber,
      whatsappPhoneNumberId: null,
      whatsappBusinessAccountId: null,
      whatsappTokenEncrypted: null,
      whatsappAppSecretEncrypted: null,
    },
  });
}

export async function removeWhatsAppIntegration(storeId: string) {
  return db.store.update({
    where: { id: storeId },
    data: {
      whatsappProvider: null,
      whatsappPhoneNumberId: null,
      whatsappBusinessAccountId: null,
      whatsappTokenEncrypted: null,
      whatsappAppSecretEncrypted: null,
      twilioAccountSid: null,
      twilioAuthTokenEncrypted: null,
      twilioWhatsappNumber: null,
    },
  });
}
