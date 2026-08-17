import { normalizeText } from "@/lib/text";
import type { AiProvider, MessageIntent, ParsedMessage } from "./provider";

/**
 * NLU "mock": interpreta a intenção do cliente com regras simples de texto,
 * sem depender de nenhuma API externa. Serve para desenvolver e testar o
 * fluxo inteiro sem gastar com IA — troque para `openai-nlu.ts` via
 * AI_PROVIDER=openai quando quiser uma interpretação mais robusta.
 *
 * Importante: esta camada NUNCA decide produto, preço ou estoque. Ela só
 * devolve intenção + um texto de busca + quantidade; quem resolve o produto
 * de verdade é o services/stock, consultando o banco.
 */

const HUMAN_HANDOFF_WORDS = ["atendente", "humano", "pessoa real", "representante", "vendedor"];

const CANCEL_WORDS = ["cancelar", "cancela", "desistir", "desisto"];

const CHECKOUT_WORDS = [
  "finalizar compra",
  "finalizar pedido",
  "finalizar carrinho",
  "fechar pedido",
  "fechar carrinho",
  "fechar o pedido",
  "concluir compra",
  "concluir pedido",
  "finalizar",
  "concluir",
];

const GREETING_WORDS = [
  "oi",
  "ola",
  "opa",
  "eae",
  "bom dia",
  "boa tarde",
  "boa noite",
  "hello",
  "hey",
];

// Confirmações claras mesmo com texto extra depois (ex: "sim, quero pagar").
const AFFIRMATIVE_PREFIXES = ["sim", "claro", "com certeza", "confirmo", "pode ser", "ok", "beleza", "isso", "aceito"];

// Só contam como confirmação se forem a mensagem inteira — como prefixo elas
// quase sempre introduzem um pedido de produto ("quero uma bateria...").
const AFFIRMATIVE_EXACT_ONLY = ["quero", "vou querer"];

const NUMBER_WORDS: Record<string, number> = {
  um: 1,
  uma: 1,
  dois: 2,
  duas: 2,
  tres: 3,
  quatro: 4,
  cinco: 5,
  seis: 6,
  sete: 7,
  oito: 8,
  nove: 9,
  dez: 10,
};

// Palavras de preenchimento removidas do texto para sobrar só a descrição da peça.
const FILLER_PHRASES = [
  "voces tem",
  "voces teem",
  "vcs tem",
  "voce tem",
  "vc tem",
  "tem disponivel",
  "gostaria de",
  "preciso de",
  "preciso",
  "quero comprar",
  "quero",
  "quanto ta",
  "quanto esta",
  "quanto custa",
  "quanto e",
  "estou procurando",
  "procuro por",
  "procuro",
  "por favor",
  "obrigado",
  "obrigada",
  "bom dia",
  "boa tarde",
  "boa noite",
  "tem",
  "unidades de",
  "unidades",
  "unidade",
];

// Sinônimos comuns usados por clientes que não sabem o nome exato do produto.
const SYNONYMS: Record<string, string> = {
  display: "tela",
  vidro: "tela",
  pilha: "bateria",
  case: "capa",
  capinha: "capa",
  carga: "conector",
  dock: "conector",
  lente: "camera",
  onze: "11",
  dez: "10",
  doze: "12",
  treze: "13",
  quatorze: "14",
  catorze: "14",
  quinze: "15",
};

function detectIntent(normalized: string): MessageIntent {
  if (HUMAN_HANDOFF_WORDS.some((word) => normalized.includes(word))) return "human_handoff";
  if (CANCEL_WORDS.some((word) => normalized.includes(word))) return "cancel";
  if (CHECKOUT_WORDS.some((word) => normalized.includes(word))) return "checkout";

  const withoutGreeting = GREETING_WORDS.reduce(
    (acc, word) => acc.replace(word, ""),
    normalized
  ).trim();
  if (GREETING_WORDS.some((word) => normalized === word) || (normalized.length > 0 && withoutGreeting.length <= 2)) {
    return "greeting";
  }

  if (AFFIRMATIVE_EXACT_ONLY.includes(normalized)) return "affirmative";
  if (AFFIRMATIVE_PREFIXES.some((phrase) => normalized === phrase || normalized.startsWith(`${phrase} `))) {
    return "affirmative";
  }

  if (normalized.length === 0) return "unknown";

  return "product_query";
}

const CATEGORY_WORDS = "telas?|baterias?|cameras?|conectores?|capas?|pecas?|displays?";

// Um número solto no meio da frase quase sempre é o MODELO do aparelho
// ("iPhone 11", "iPhone 13"), não a quantidade — por isso só tratamos um
// dígito/número por extenso como quantidade quando ele aparece num contexto
// bem específico de "estou pedindo N unidades". `matchedText` é removido do
// texto antes de extrair o nome do produto, para não sobrar lixo tipo "3".
function extractQuantity(normalized: string): { quantity: number; matchedText: string | null } {
  const patterns = [
    new RegExp(`\\b(\\d+)\\s*(?:unidades?|pecas?|pcs)\\b`),
    new RegExp(`\\b(?:quero|queria|preciso de|preciso|vou querer|vou levar|manda|me ve)\\s+(\\d+)\\b`),
    new RegExp(`^(\\d+)\\s+(?:${CATEGORY_WORDS})\\b`),
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match) return { quantity: Math.max(1, parseInt(match[1], 10)), matchedText: match[0] };
  }

  for (const [word, value] of Object.entries(NUMBER_WORDS)) {
    const wordPattern = new RegExp(`\\b${word}\\s+(?:${CATEGORY_WORDS}|unidades?)\\b`);
    const match = normalized.match(wordPattern);
    if (match) return { quantity: value, matchedText: match[0] };
  }

  return { quantity: 1, matchedText: null };
}

function extractProductQuery(normalized: string, quantityMatchedText: string | null): string {
  let cleaned = ` ${normalized} `;

  if (quantityMatchedText) {
    cleaned = cleaned.replace(quantityMatchedText, " ");
  }

  for (const phrase of FILLER_PHRASES) {
    cleaned = cleaned.replaceAll(` ${phrase} `, " ");
  }

  const tokens = cleaned
    .split(" ")
    .map((token) => token.trim())
    .filter(Boolean)
    .map((token) => SYNONYMS[token] ?? token)
    // heurística simples de plural (telas -> tela, baterias -> bateria)
    .map((token) => (token.length > 4 && token.endsWith("s") ? token.slice(0, -1) : token));

  return tokens.join(" ").trim();
}

export const mockNlu: AiProvider = {
  async parseMessage(text: string): Promise<ParsedMessage> {
    const normalized = normalizeText(text);
    const intent = detectIntent(normalized);
    const { quantity, matchedText } = extractQuantity(normalized);
    const productQuery = intent === "product_query" ? extractProductQuery(normalized, matchedText) : "";

    return { intent, productQuery, quantity };
  },
};
