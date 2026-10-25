/**
 * Roda no build da Vercel (script "vercel-build"): aplica as migrações
 * pendentes do Prisma no banco de produção (Neon) antes de gerar o site.
 * Só em produção — deploys de preview usam o mesmo banco e não devem mexer
 * na estrutura dele. Usa a conexão direta (sem pooler), que é a que o
 * `prisma migrate` exige.
 */
import { execSync } from "node:child_process";

if (process.env.VERCEL_ENV !== "production") {
  console.log("[migrate-on-deploy] não é produção, pulando migrações");
  process.exit(0);
}

const url = process.env.NEON_DATABASE_URL_UNPOOLED;
if (!url) {
  console.error("[migrate-on-deploy] NEON_DATABASE_URL_UNPOOLED não configurada");
  process.exit(1);
}

// connect_timeout: o Neon grátis pode estar "dormindo" e levar alguns segundos pra acordar.
const withTimeout = `${url}${url.includes("?") ? "&" : "?"}connect_timeout=60`;
execSync("npx prisma migrate deploy", {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: withTimeout, DIRECT_URL: withTimeout },
});
