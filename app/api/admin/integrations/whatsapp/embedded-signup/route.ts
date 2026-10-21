import { randomInt } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentStoreId } from "@/lib/current-store";
import { META_GRAPH_URL } from "@/lib/meta";
import { getStoreIntegrationsStatus, saveMetaIntegration } from "@/services/store";

/**
 * Callback do Meta Embedded Signup ("conectar com um clique"). Recebe o código
 * de autorização (válido por ~30s) + os IDs que o popup da Meta devolveu e
 * conclui o onboarding da loja:
 *
 * 1. troca o código por um token de acesso da loja;
 * 2. descobre o número (no fluxo de Coexistência o evento de fim não traz
 *    phone_number_id — buscamos pelo WABA);
 * 3. assina o nosso app nos webhooks do WABA da loja (sem isso a Meta não
 *    entrega as mensagens dos clientes pra Donna);
 * 4. só para número novo: registra o número na Cloud API. Número que já está
 *    no app WhatsApp Business (Coexistência) NÃO pode ser registrado.
 *
 * Docs: developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup
 */

type SignupMode = "new_number" | "business_app";

class MetaApiError extends Error {}

/** Motivo legível do erro da Meta (vai pra tela do lojista — sem tokens, só a mensagem e o código). */
function describeMetaError(json: unknown, fallback: string) {
  const error = (json as { error?: { message?: string; error_user_msg?: string; code?: number } })?.error;
  const message = error?.error_user_msg || error?.message;
  return message ? `${message}${error?.code ? ` (código ${error.code})` : ""}` : fallback;
}

/**
 * Plano B quando o popup não mandou o waba_id (o evento de fim às vezes não
 * chega, principalmente na Coexistência): o token da loja só tem acesso ao
 * WABA que ela acabou de compartilhar, e o debug_token lista esse ID.
 */
async function findSharedWabaId(token: string, appId: string, appSecret: string) {
  const url = new URL(`${META_GRAPH_URL}/debug_token`);
  url.searchParams.set("input_token", token);
  url.searchParams.set("access_token", `${appId}|${appSecret}`);
  const response = await fetch(url.toString());
  const json = await response.json().catch(() => ({}));
  const scopes: { scope?: string; target_ids?: string[] }[] = json.data?.granular_scopes ?? [];
  const ids =
    scopes.find((s) => s.scope === "whatsapp_business_management")?.target_ids ??
    scopes.find((s) => s.scope === "whatsapp_business_messaging")?.target_ids;
  if (!ids?.length) console.error("[embedded-signup] debug_token sem WABA", json);
  return ids?.[0];
}

async function graph(path: string, token: string, init?: { method?: string; body?: Record<string, unknown> }) {
  const response = await fetch(`${META_GRAPH_URL}${path}`, {
    method: init?.method ?? "GET",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: init?.body ? JSON.stringify(init.body) : undefined,
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error(`[embedded-signup] ${init?.method ?? "GET"} ${path} falhou`, json);
    throw new MetaApiError(describeMetaError(json, `Meta respondeu ${response.status} em ${path}`));
  }
  return json;
}

async function exchangeCodeForToken(code: string, appId: string, appSecret: string): Promise<string> {
  const tokenUrl = new URL(`${META_GRAPH_URL}/oauth/access_token`);
  tokenUrl.searchParams.set("client_id", appId);
  tokenUrl.searchParams.set("client_secret", appSecret);
  tokenUrl.searchParams.set("code", code);

  const response = await fetch(tokenUrl.toString());
  const json = await response.json().catch(() => ({}));
  if (!response.ok || typeof json.access_token !== "string") {
    console.error("[embedded-signup] troca de token falhou", json);
    throw new MetaApiError(describeMetaError(json, "Troca do código por token falhou"));
  }
  return json.access_token;
}

export async function POST(request: NextRequest) {
  try {
    const storeId = await getCurrentStoreId();
    const { code, phoneNumberId: capturedPhoneNumberId, wabaId: capturedWabaId, mode } = await request.json();
    const signupMode: SignupMode = mode === "business_app" ? "business_app" : "new_number";

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Código de autorização ausente" }, { status: 400 });
    }
    const appId = process.env.NEXT_PUBLIC_META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;
    if (!appId || !appSecret) {
      return NextResponse.json({ error: "App da Meta não configurado no servidor" }, { status: 500 });
    }

    const token = await exchangeCodeForToken(code, appId, appSecret);

    const wabaId =
      typeof capturedWabaId === "string" && capturedWabaId
        ? capturedWabaId
        : await findSharedWabaId(token, appId, appSecret);
    if (!wabaId) {
      return NextResponse.json(
        {
          error:
            "A Meta não informou qual conta do WhatsApp foi conectada. Refaça a conexão e, no final, marque a conta e o número da loja.",
        },
        { status: 400 }
      );
    }

    let phoneNumberId = typeof capturedPhoneNumberId === "string" ? capturedPhoneNumberId : undefined;
    if (!phoneNumberId) {
      const numbers = await graph(`/${wabaId}/phone_numbers?fields=id,display_phone_number`, token);
      phoneNumberId = numbers.data?.[0]?.id;
      if (!phoneNumberId) {
        return NextResponse.json({ error: "Nenhum número encontrado na conta do WhatsApp conectada" }, { status: 400 });
      }
    }

    await graph(`/${wabaId}/subscribed_apps`, token, { method: "POST" });

    const phoneInfo = await graph(`/${phoneNumberId}?fields=platform_type`, token);
    // Reconexão de um número que já está na Cloud API: registrar de novo daria erro.
    if (signupMode === "new_number" && phoneInfo.platform_type !== "CLOUD_API") {
      // A Cloud API exige um PIN de 6 dígitos (verificação em duas etapas) no
      // registro. Se a loja precisar dele depois (ex: migrar o número), dá pra
      // redefinir no Gerenciador do WhatsApp da Meta.
      const pin = String(randomInt(0, 1_000_000)).padStart(6, "0");
      await graph(`/${phoneNumberId}/register`, token, {
        method: "POST",
        body: { messaging_product: "whatsapp", pin },
      });
    }

    await saveMetaIntegration(storeId, { token, phoneNumberId, businessAccountId: wabaId });

    const status = await getStoreIntegrationsStatus(storeId);
    return NextResponse.json({ data: status });
  } catch (error) {
    console.error("[POST /api/admin/integrations/whatsapp/embedded-signup]", error);
    const message =
      error instanceof MetaApiError
        ? `Não foi possível concluir a conexão com a Meta: ${error.message}`
        : "Erro ao concluir a conexão";
    return NextResponse.json({ error: message }, { status: error instanceof MetaApiError ? 502 : 500 });
  }
}
