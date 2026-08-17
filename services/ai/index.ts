import type { AiProvider } from "./provider";
import { mockNlu } from "./mock-nlu";
import { openaiNlu } from "./openai-nlu";

export function getAiProvider(): AiProvider {
  if (process.env.AI_PROVIDER === "openai") return openaiNlu;
  return mockNlu;
}

export type { AiProvider, MessageIntent, ParsedMessage } from "./provider";
