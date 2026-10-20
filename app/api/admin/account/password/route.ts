import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { changePasswordSchema } from "@/lib/validations/auth";

/** Usuário logado troca a própria senha (exige a senha atual). */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const parsed = changePasswordSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({ where: { id: session.user.id } });
    if (!user || !(await bcrypt.compare(parsed.data.currentPassword, user.passwordHash))) {
      return NextResponse.json(
        { error: "Senha atual incorreta", issues: { currentPassword: ["Senha atual incorreta"] } },
        { status: 400 }
      );
    }

    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, 10) },
    });

    return NextResponse.json({ data: true });
  } catch (error) {
    console.error("[POST /api/admin/account/password]", error);
    return NextResponse.json({ error: "Erro ao trocar a senha" }, { status: 500 });
  }
}
