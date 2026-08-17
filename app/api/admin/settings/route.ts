import { NextRequest, NextResponse } from "next/server";
import { getCurrentStoreId } from "@/lib/current-store";
import { storeSettingsSchema } from "@/lib/validations/store";
import { getStoreSettings, updateStoreSettings } from "@/services/store";

export async function GET() {
  try {
    const storeId = await getCurrentStoreId();
    const store = await getStoreSettings(storeId);
    return NextResponse.json({ data: store });
  } catch (error) {
    console.error("[GET /api/admin/settings]", error);
    return NextResponse.json({ error: "Erro ao carregar configurações" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const storeId = await getCurrentStoreId();
    const body = await request.json();
    const parsed = storeSettingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const store = await updateStoreSettings(storeId, parsed.data);
    return NextResponse.json({ data: store });
  } catch (error) {
    console.error("[PATCH /api/admin/settings]", error);
    return NextResponse.json({ error: "Erro ao salvar configurações" }, { status: 500 });
  }
}
