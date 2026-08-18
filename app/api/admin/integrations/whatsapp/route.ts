import { NextRequest, NextResponse } from "next/server";
import { getCurrentStoreId } from "@/lib/current-store";
import { saveWhatsAppIntegrationSchema } from "@/lib/validations/integrations";
import {
  getStoreIntegrationsStatus,
  removeWhatsAppIntegration,
  saveMetaIntegration,
  saveTwilioIntegration,
} from "@/services/store";

export async function GET() {
  try {
    const storeId = await getCurrentStoreId();
    const status = await getStoreIntegrationsStatus(storeId);
    return NextResponse.json({ data: status });
  } catch (error) {
    console.error("[GET /api/admin/integrations/whatsapp]", error);
    return NextResponse.json({ error: "Erro ao carregar integração" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const storeId = await getCurrentStoreId();
    const body = await request.json();
    const parsed = saveWhatsAppIntegrationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    if (parsed.data.provider === "meta") {
      await saveMetaIntegration(storeId, {
        token: parsed.data.token,
        phoneNumberId: parsed.data.phoneNumberId,
        businessAccountId: parsed.data.businessAccountId || undefined,
        appSecret: parsed.data.appSecret || undefined,
      });
    } else {
      await saveTwilioIntegration(storeId, {
        accountSid: parsed.data.accountSid,
        authToken: parsed.data.authToken,
        whatsappNumber: parsed.data.whatsappNumber,
      });
    }

    const status = await getStoreIntegrationsStatus(storeId);
    return NextResponse.json({ data: status });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "P2002") {
      return NextResponse.json(
        { error: "Esse número já está cadastrado em outra loja neste sistema." },
        { status: 409 }
      );
    }
    console.error("[POST /api/admin/integrations/whatsapp]", error);
    return NextResponse.json({ error: "Erro ao salvar integração" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const storeId = await getCurrentStoreId();
    await removeWhatsAppIntegration(storeId);
    const status = await getStoreIntegrationsStatus(storeId);
    return NextResponse.json({ data: status });
  } catch (error) {
    console.error("[DELETE /api/admin/integrations/whatsapp]", error);
    return NextResponse.json({ error: "Erro ao remover integração" }, { status: 500 });
  }
}
