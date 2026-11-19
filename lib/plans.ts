// Planos da Donna: fonte única de preços, limites e recursos. Usado no site,
// no cadastro, no checkout (Asaas), no painel e na tela da plataforma.
// Sem acesso a banco: pode ser importado em componentes de cliente.

export const PLAN_TIERS = ["essential", "professional", "business"] as const;
export type PlanTier = (typeof PLAN_TIERS)[number];
export type BillingCycle = "monthly" | "yearly";
/** Como o plano fica salvo em Store.intendedPlan, ex.: "professional_yearly". */
export type PlanId = `${PlanTier}_${BillingCycle}`;

/** Anual = 10 mensalidades (2 meses grátis). */
export const YEARLY_MONTHS_CHARGED = 10;

/** Recursos liberados por plano (o que não está aqui vale para todos). */
export type PlanFeature = "analytics" | "customerHistory";

export const TIERS: Record<
  PlanTier,
  {
    name: string;
    tagline: string;
    monthly: number;
    /** Conversas atendidas por mês (1 cliente atendido em um dia = 1 conversa). */
    conversations: number;
    features: PlanFeature[];
    /** "Tudo do X, mais:" no card. */
    includes?: string;
    bullets: string[];
    highlight?: string;
  }
> = {
  essential: {
    name: "Essential",
    tagline: "Para lojas que estão começando a automatizar o atendimento no WhatsApp.",
    monthly: 149.9,
    conversations: 300,
    features: [],
    bullets: [
      "A Donna atende seus clientes no WhatsApp da loja, 24 horas por dia",
      "Responde preço, foto e disponibilidade direto do seu estoque",
      "Monta o carrinho e cria o pedido na conversa",
      "Chama você quando o cliente precisa de um atendente ou quer pagar",
      "Cadastro de produtos e categorias com controle de estoque",
      "Painel com conversas, pedidos e clientes",
      "Nome da assistente e mensagens da loja personalizados",
      "Até 300 conversas atendidas por mês*",
      "Suporte por WhatsApp",
    ],
  },
  professional: {
    name: "Professional",
    tagline: "Para lojas que já recebem muitos pedidos pelo WhatsApp.",
    monthly: 249.9,
    conversations: 1000,
    features: ["analytics", "customerHistory"],
    includes: "Tudo do Essential, mais:",
    highlight: "Mais vendido",
    bullets: [
      "Até 1.000 conversas atendidas por mês*",
      "Painel de vendas: faturamento, ticket médio e comparação com o período anterior",
      "Funil de conversão: quantos conversaram, fecharam o carrinho e pagaram",
      "Produtos mais vendidos e alerta de estoque mínimo",
      "Histórico completo de cada cliente: conversas, pedidos e total gasto",
      "Suporte prioritário",
    ],
  },
  business: {
    name: "Business",
    tagline: "Para lojas com volume alto de atendimento.",
    monthly: 449.9,
    conversations: 3000,
    features: ["analytics", "customerHistory"],
    includes: "Tudo do Professional, mais:",
    bullets: [
      "Até 3.000 conversas atendidas por mês*",
      "Ajuda para configurar a loja e cadastrar os produtos",
      "Suporte VIP com atendimento direto com o fundador",
    ],
  },
};

export const PLAN_FOOTNOTE =
  "*Uma conversa é um cliente atendido em um período de 24 horas. As taxas de mensagens da Meta (WhatsApp) são cobradas pela Meta direto na conta da loja.";

export const DEFAULT_PLAN: PlanId = "professional_monthly";

export function planId(tier: PlanTier, cycle: BillingCycle): PlanId {
  return `${tier}_${cycle}`;
}

export function isPlanId(value: unknown): value is PlanId {
  if (typeof value !== "string") return false;
  const [tier, cycle] = value.split("_");
  return (PLAN_TIERS as readonly string[]).includes(tier) && (cycle === "monthly" || cycle === "yearly");
}

export function parsePlanId(id: PlanId): { tier: PlanTier; cycle: BillingCycle } {
  const [tier, cycle] = id.split("_") as [PlanTier, BillingCycle];
  return { tier, cycle };
}

export function yearlyPrice(tier: PlanTier) {
  return Math.round(TIERS[tier].monthly * YEARLY_MONTHS_CHARGED);
}

/** Valor cobrado por ciclo. */
export function planPrice(id: PlanId) {
  const { tier, cycle } = parsePlanId(id);
  return cycle === "yearly" ? yearlyPrice(tier) : TIERS[tier].monthly;
}

export function planLabel(id: PlanId) {
  const { tier, cycle } = parsePlanId(id);
  return `${TIERS[tier].name} ${cycle === "yearly" ? "anual" : "mensal"}`;
}

/**
 * Plano em vigor de uma loja a partir do Store.intendedPlan. Valores antigos
 * ("monthly", "yearly", "founder" — o plano completo de antes) e lojas sem
 * plano (liberadas à mão) ficam com tudo liberado, no nível Business.
 */
export function storePlan(intendedPlan: string | null | undefined): { tier: PlanTier; cycle: BillingCycle; legacy: boolean } {
  if (isPlanId(intendedPlan)) return { ...parsePlanId(intendedPlan), legacy: false };
  return { tier: "business", cycle: intendedPlan === "yearly" ? "yearly" : "monthly", legacy: true };
}

export function tierHas(tier: PlanTier, feature: PlanFeature) {
  return TIERS[tier].features.includes(feature);
}

/** Nome legível para a tela da plataforma (aceita valores antigos). */
export function describeIntendedPlan(intendedPlan: string | null | undefined) {
  if (isPlanId(intendedPlan)) return `${planLabel(intendedPlan)} (${formatBRL(planPrice(intendedPlan))})`;
  const legacy: Record<string, string> = { monthly: "Completo mensal (antigo)", yearly: "Completo anual (antigo)", founder: "Fundador (antigo)" };
  return intendedPlan ? (legacy[intendedPlan] ?? intendedPlan) : "—";
}

export function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}
