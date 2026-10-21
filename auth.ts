import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { loginSchema } from "@/lib/validations/auth";
import { isRateLimited, resetRateLimit } from "@/lib/rate-limit";

const LOGIN_MAX_ATTEMPTS = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

export const { handlers, signIn, signOut, auth } = NextAuth({
  // 7 dias (o padrão do Auth.js é 30): limita por quanto tempo um cookie de
  // sessão vazado ou de um computador esquecido continua valendo.
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 },
  pages: { signIn: "/login" },
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        // Por e-mail: 10 tentativas a cada 15 min, depois recusa até a janela passar.
        const limitKey = `login:${parsed.data.email.toLowerCase()}`;
        if (isRateLimited(limitKey, LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_MS)) return null;

        const user = await db.user.findUnique({ where: { email: parsed.data.email } });
        if (!user) return null;

        const passwordValid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!passwordValid) return null;
        resetRateLimit(limitKey);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          storeId: user.storeId,
          role: user.role,
          isPlatformAdmin: user.isPlatformAdmin,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.storeId = user.storeId;
        token.role = user.role;
        token.isPlatformAdmin = user.isPlatformAdmin;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.storeId = token.storeId as string;
      session.user.role = token.role as string;
      session.user.isPlatformAdmin = token.isPlatformAdmin as boolean;
      return session;
    },
  },
});
