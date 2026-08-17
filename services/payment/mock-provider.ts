import QRCode from "qrcode";
import type { ChargeParams, Charge, PaymentProvider } from "./provider";

/**
 * Gera uma cobrança PIX fictícia: um código "copia e cola" no formato do
 * padrão PIX (só para parecer real visualmente — não é um payload válido de
 * verdade) e um QR Code de imagem gerado a partir desse texto. Nenhuma
 * chamada de rede acontece; nenhuma credencial é usada. É assim que você
 * testa o fluxo inteiro de pagamento sem uma conta em gateway nenhum.
 */
export const mockPaymentProvider: PaymentProvider = {
  async createCharge({ orderId, amount }: ChargeParams): Promise<Charge> {
    const externalId = `mock_${orderId}_${Date.now()}`;
    const copyPasteCode = buildFakePixCode(externalId, amount);
    const qrCode = await QRCode.toDataURL(copyPasteCode, { margin: 1, width: 280 });

    return { externalId, qrCode, copyPasteCode, amount };
  },
};

function buildFakePixCode(externalId: string, amount: number): string {
  const amountStr = amount.toFixed(2);
  return `00020126580014BR.GOV.BCB.PIX0136${externalId}5204000053039865406${amountStr}5802BR5913BOTLOJA MOCK6009SAO PAULO62070503***6304MOCK`;
}
