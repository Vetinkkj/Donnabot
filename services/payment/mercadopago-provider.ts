import type { ChargeParams, Charge, PaymentProvider } from "./provider";

/**
 * Stub para o Mercado Pago (Pix via Checkout Transparente). Não testado
 * contra a API real — este projeto não usa credenciais reais. Sirva como
 * ponto de partida; confira o payload exato em
 * https://www.mercadopago.com.br/developers ao integrar de verdade.
 *
 * Efí/Gerencianet, Asaas e PagBank seguem a mesma interface PaymentProvider
 * — para adicionar um deles, crie um arquivo irmão (ex: efi-provider.ts)
 * implementando `createCharge` e registre-o em `index.ts`.
 */
export const mercadoPagoProvider: PaymentProvider = {
  async createCharge({ orderId, amount, description }: ChargeParams): Promise<Charge> {
    const apiKey = process.env.PAYMENT_API_KEY;
    if (!apiKey) throw new Error("PAYMENT_API_KEY não configurado");

    const response = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "X-Idempotency-Key": orderId,
      },
      body: JSON.stringify({
        transaction_amount: amount,
        description,
        payment_method_id: "pix",
        // troque pelo e-mail real do cliente ao integrar de verdade
        payer: { email: "cliente@botloja.dev" },
      }),
    });

    if (!response.ok) {
      throw new Error(`Mercado Pago respondeu ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    const transactionData = data.point_of_interaction?.transaction_data;

    return {
      externalId: String(data.id),
      qrCode: `data:image/png;base64,${transactionData?.qr_code_base64}`,
      copyPasteCode: transactionData?.qr_code,
      amount,
    };
  },
};
