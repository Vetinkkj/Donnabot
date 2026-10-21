import { PrismaClient } from "@prisma/client";

// Evita criar múltiplas instâncias do PrismaClient durante hot-reload no Next.js dev.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Em produção o banco é o Neon, conectado pela integração da Vercel (que
    // cria as variáveis NEON_*); a URL com pooler é a própria pro Prisma. Fora
    // disso (dev local), vale o DATABASE_URL do .env.
    datasourceUrl: process.env.NEON_POSTGRES_PRISMA_URL || process.env.DATABASE_URL,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
