import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Protege o painel admin e as APIs administrativas.
 *
 * Usa `getToken` (next-auth/jwt) em vez de instanciar `NextAuth()` aqui —
 * é a forma leve e Edge-compatible de só ler/validar o cookie de sessão,
 * sem precisar da configuração completa (providers, callbacks etc.), que
 * só é necessária no fluxo de login de verdade (em auth.ts).
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // Em produção (HTTPS) o Auth.js usa o cookie "__Secure-authjs.session-token"
  // — sem isso, getToken procura o nome errado e nunca acha a sessão.
  const secureCookie = req.nextUrl.protocol === "https:";
  const token = await getToken({ req, secret: process.env.AUTH_SECRET, secureCookie });

  if (pathname === "/login") {
    if (token) return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
    return NextResponse.next();
  }

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/dashboard/:path*",
    "/products/:path*",
    "/orders/:path*",
    "/conversations/:path*",
    "/customers/:path*",
    "/settings/:path*",
    "/api/admin/:path*",
  ],
};
