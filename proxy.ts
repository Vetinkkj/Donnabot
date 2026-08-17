import { NextResponse } from "next/server";
import { auth } from "@/auth";

/**
 * Protege o painel admin e as APIs administrativas. No Next.js 16 este
 * arquivo roda no runtime Node.js (antes era "middleware.ts" e rodava no
 * Edge) — por isso dá pra usar `auth()` com sessão JWT normalmente aqui.
 */
export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;

  if (pathname === "/login") {
    if (req.auth) return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
    return NextResponse.next();
  }

  if (!req.auth) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

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
