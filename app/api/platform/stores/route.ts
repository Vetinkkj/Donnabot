import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { listAllStoresForPlatformAdmin } from "@/services/store";

export async function GET() {
  const session = await auth();
  if (!session?.user?.isPlatformAdmin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const stores = await listAllStoresForPlatformAdmin();
    return NextResponse.json({ data: stores });
  } catch (error) {
    console.error("[GET /api/platform/stores]", error);
    return NextResponse.json({ error: "Erro ao listar lojas" }, { status: 500 });
  }
}
