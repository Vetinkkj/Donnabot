import { NextRequest, NextResponse } from "next/server";
import { getCurrentStoreId } from "@/lib/current-store";
import { getStoreIntegrationsStatus, saveMetaIntegration } from "@/services/store";

/**
 * Callback do Meta Embedded Signup: troca o código de autorização (válido
 * só por ~30s) por um token de acesso e salva a integração da loja. Não
 * testado contra a API de verdade — exige App/config_id reais de Tech
 * Provider aprovado pela Meta (ver components/admin/MetaEmbeddedSignupButton.tsx).
 */
export async function POST(request: NextRequest) {
  try {
    const storeId = await getCurrentStoreId();
    const { code, phoneNumberId, wabaId } = await request.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Código de autorização ausente" }, { status: 400 });
    }
    if (!phoneNumberId || typeof phoneNumberId !== "string") {
      return NextResponse.json(
        { error: "Não foi possível capturar o número conectado — tente novamente" },
        { status: 400 }
      );
    }

    const appId = process.env.NEXT_PUBLIC_META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;
    if (!appId || !appSecret) {
      return NextResponse.json({ error: "App da Meta não configurado no servidor" }, { status: 500 });
    }

    const tokenUrl = new URL("https://graph.facebook.com/v20.0/oauth/access_token");
    tokenUrl.searchParams.set("client_id", appId);
    tokenUrl.searchParams.set("client_secret", appSecret);
    tokenUrl.searchParams.set("code", code);

    const tokenResponse = await fetch(tokenUrl.toString());
    const tokenJson = await tokenResponse.json();

    if (!tokenResponse.ok || typeof tokenJson.access_token !== "string") {
      console.error("[POST /api/admin/integrations/whatsapp/embedded-signup] troca de token falhou", tokenJson);
      return NextResponse.json({ error: "Não foi possível concluir a conexão com a Meta" }, { status: 502 });
    }

    await saveMetaIntegration(storeId, {
      token: tokenJson.access_token,
      phoneNumberId,
      businessAccountId: typeof wabaId === "string" ? wabaId : undefined,
    });

    const status = await getStoreIntegrationsStatus(storeId);
    return NextResponse.json({ data: status });
  } catch (error) {
    console.error("[POST /api/admin/integrations/whatsapp/embedded-signup]", error);
    return NextResponse.json({ error: "Erro ao concluir a conexão" }, { status: 500 });
  }
}
