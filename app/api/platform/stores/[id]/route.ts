import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { updateStoreAccessSchema } from "@/lib/validations/platform";
import { updateStoreAccess } from "@/services/store";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.isPlatformAdmin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateStoreAccessSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const store = await updateStoreAccess(id, parsed.data);
    return NextResponse.json({ data: store });
  } catch (error) {
    console.error("[PATCH /api/platform/stores/:id]", error);
    return NextResponse.json({ error: "Erro ao atualizar loja" }, { status: 500 });
  }
}
