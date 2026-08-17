export type MessageIntent =
  | "greeting"
  | "human_handoff"
  | "affirmative"
  | "checkout"
  | "cancel"
  | "product_query"
  | "unknown";

export type ParsedMessage = {
  intent: MessageIntent;
  /** Texto "limpo" do que o cliente pediu (ex: "tela iphone 11"). NUNCA um produto/preço decidido pela IA. */
  productQuery: string;
  quantity: number;
};

export interface AiProvider {
  parseMessage(text: string): Promise<ParsedMessage>;
}
