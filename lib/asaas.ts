/**
 * Cliente mínimo da API v3 do Asaas — cobrança da assinatura da Donna (as
 * lojas pagando a Balbitech). Docs: docs.asaas.com
 *
 * ASAAS_ENV=production usa a conta real; qualquer outro valor (ou vazio) usa o
 * sandbox, onde nenhum dinheiro de verdade circula.
 */

export class AsaasError extends Error {}

function baseUrl() {
  return process.env.ASAAS_ENV === "production" ? "https://api.asaas.com/v3" : "https://api-sandbox.asaas.com/v3";
}

export function isAsaasConfigured() {
  return Boolean(process.env.ASAAS_API_KEY);
}

export async function asaas<T = Record<string, unknown>>(
  path: string,
  init?: { method?: "GET" | "POST" | "DELETE"; body?: Record<string, unknown> }
): Promise<T> {
  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey) throw new AsaasError("Cobrança ainda não configurada");

  const response = await fetch(`${baseUrl()}${path}`, {
    method: init?.method ?? "GET",
    headers: {
      access_token: apiKey,
      "Content-Type": "application/json",
      // O Asaas recusa chamadas sem User-Agent em contas novas.
      "User-Agent": "Donnabot",
    },
    body: init?.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error(`[asaas] ${init?.method ?? "GET"} ${path} falhou`, response.status, json);
    // O Asaas devolve { errors: [{ code, description }] } com mensagens em português.
    const description = (json as { errors?: { description?: string }[] }).errors?.[0]?.description;
    throw new AsaasError(description ?? `Asaas respondeu ${response.status}`);
  }
  return json as T;
}
