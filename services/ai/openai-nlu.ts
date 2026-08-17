import type { AiProvider, MessageIntent, ParsedMessage } from "./provider";
import { mockNlu } from "./mock-nlu";

/**
 * Provider de IA real, usando a API de chat completions da OpenAI (formato
 * compatível com a maioria dos provedores) para interpretar a mensagem.
 *
 * Não testamos contra uma chave real neste projeto (não usamos credenciais
 * reais). A IA é instruída a devolver SOMENTE intenção + texto de busca +
 * quantidade em JSON — nunca preço, estoque ou nome exato de produto, que
 * continuam sendo resolvidos pelo services/stock direto no banco.
 *
 * Se a chamada falhar por qualquer motivo (rede, chave inválida, resposta
 * fora do formato esperado), cai de volta para o NLU mock em vez de quebrar
 * o atendimento do cliente.
 */

const VALID_INTENTS: MessageIntent[] = [
  "greeting",
  "human_handoff",
  "affirmative",
  "checkout",
  "cancel",
  "product_query",
  "unknown",
];

const SYSTEM_PROMPT = `Você interpreta mensagens de clientes de uma loja de peças de celular.
Devolva APENAS um JSON no formato {"intent": "...", "productQuery": "...", "quantity": ...}.
- intent deve ser um de: greeting, human_handoff, affirmative, checkout, cancel, product_query, unknown.
- checkout: o cliente quer fechar/finalizar o pedido (ex: "finalizar compra", "fechar pedido").
- cancel: o cliente quer cancelar o carrinho ou pedido atual.
- productQuery é o texto descrevendo a peça pedida (ex: "tela iphone 11"), vazio se não houver.
- quantity é um número inteiro (padrão 1).
Nunca invente nome de produto, preço ou disponibilidade — apenas interprete a mensagem.`;

export const openaiNlu: AiProvider = {
  async parseMessage(text: string): Promise<ParsedMessage> {
    const apiKey = process.env.AI_API_KEY;
    if (!apiKey) return mockNlu.parseMessage(text);

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: process.env.AI_MODEL || "gpt-4o-mini",
          temperature: 0,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: text },
          ],
        }),
      });

      if (!response.ok) throw new Error(`OpenAI respondeu ${response.status}`);

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error("Resposta da IA sem conteúdo");

      const parsed = JSON.parse(content);
      const intent: MessageIntent = VALID_INTENTS.includes(parsed.intent) ? parsed.intent : "unknown";
      const quantity = Number.isFinite(parsed.quantity) && parsed.quantity > 0 ? Math.floor(parsed.quantity) : 1;
      const productQuery = typeof parsed.productQuery === "string" ? parsed.productQuery : "";

      return { intent, productQuery, quantity };
    } catch (error) {
      console.error("[services/ai/openai-nlu] erro ao chamar IA, usando mock:", error);
      return mockNlu.parseMessage(text);
    }
  },
};
