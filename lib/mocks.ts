/**
 * Simuladores (chat falso, pagamento falso, QR de teste) só existem fora de
 * produção. Eles não têm login e agem na primeira loja do banco — em produção
 * isso deixaria qualquer pessoa ler conversas, injetar mensagens e marcar
 * pedidos como pagos. ENABLE_MOCKS=true religa, só para um teste pontual.
 */
export function mocksEnabled(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.ENABLE_MOCKS === "true";
}
