import { NextRequest, NextResponse } from "next/server";
import { getCurrentStoreId } from "@/lib/current-store";
import { createPixCharge } from "@/services/payment";

/**
 * Serve o QR Code do PIX como imagem PNG de verdade (não um data: URL).
 * Necessário porque WhatsApp (Meta e Twilio) só aceita enviar imagem a
 * partir de uma URL pública que o provedor consiga baixar — não aceita um
 * data: URI embutido direto na mensagem.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const { orderId } = await params;
    const storeId = await getCurrentStoreId();
    const result = await createPixCharge(storeId, orderId);

    if (!result?.payment?.qrCode) {
      return NextResponse.json({ error: "QR Code não encontrado" }, { status: 404 });
    }

    const base64 = result.payment.qrCode.split(",")[1];
    if (!base64) return NextResponse.json({ error: "QR Code inválido" }, { status: 500 });

    const buffer = Buffer.from(base64, "base64");
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (error) {
    console.error("[GET /api/payment-qr/:orderId]", error);
    return NextResponse.json({ error: "Erro ao gerar QR Code" }, { status: 500 });
  }
}
