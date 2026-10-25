// Status de pedido e de pagamento — uma fonte só para Pedidos, Clientes e Atendimento.
// O pedido tem um status; o pagamento (quando existe) é registrado à parte.

type Tone = "success" | "warning" | "danger" | "neutral" | "info";

export const ORDER_STATUS: Record<string, { label: string; short: string; tone: Tone; description: string }> = {
  PENDING: {
    label: "Aguardando pagamento",
    short: "Pendente",
    tone: "warning",
    description: "O cliente finalizou o carrinho. Envie o link de pagamento e confirme quando ele pagar.",
  },
  PAID: { label: "Pago", short: "Pago", tone: "success", description: "Pagamento confirmado e estoque já descontado." },
  CANCELLED: { label: "Cancelado", short: "Cancelado", tone: "danger", description: "Pedido cancelado. Nenhum estoque foi descontado." },
  EXPIRED: { label: "Expirado", short: "Expirado", tone: "neutral", description: "O prazo de pagamento acabou sem confirmação." },
};

/** Como o pagamento foi registrado: manual (atendente confirmou) ou por gateway. */
export function paymentMethodLabel(provider: string | null | undefined) {
  if (!provider) return null;
  if (provider === "manual") return "Confirmado manualmente";
  if (provider === "mock") return "PIX (simulado)";
  const names: Record<string, string> = {
    mercadopago: "Mercado Pago",
    asaas: "Asaas",
    efi: "Efí",
    pagbank: "PagBank",
  };
  return `PIX · ${names[provider] ?? provider}`;
}
