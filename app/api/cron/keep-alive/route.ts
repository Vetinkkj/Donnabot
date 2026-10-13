import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Chamado 1x por dia pelo Cron Job da Vercel (ver vercel.json). O plano
 * grátis do Supabase pausa o banco depois de alguns dias sem atividade — e
 * com o banco pausado o login do painel e a Donna no WhatsApp param. Uma
 * leitura simples por dia conta como atividade e evita a pausa.
 *
 * Só lê (contagem de lojas), não altera nada. Se CRON_SECRET estiver
 * configurado na Vercel, ela manda `Authorization: Bearer <CRON_SECRET>`
 * automaticamente e qualquer outra chamada é recusada.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    await db.store.count();
    return NextResponse.json({ ok: true, checkedAt: new Date().toISOString() });
  } catch (error) {
    console.error("[GET /api/cron/keep-alive]", error);
    return NextResponse.json({ ok: false, error: "Banco indisponível" }, { status: 503 });
  }
}
