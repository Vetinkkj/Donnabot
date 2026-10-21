/**
 * Limite de tentativas em memória (janela fixa). Na Vercel cada instância tem
 * a sua memória, então o limite é por instância — não é à prova de um ataque
 * distribuído, mas corta a força bruta comum (milhares de senhas seguidas na
 * mesma conta) sem precisar de Redis.
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  if (buckets.size > 10_000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  bucket.count += 1;
  return bucket.count > limit;
}

export function resetRateLimit(key: string) {
  buckets.delete(key);
}
