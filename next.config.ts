import type { NextConfig } from "next";

/**
 * Cabeçalhos de segurança em todas as respostas:
 * - frame-ancestors/X-Frame-Options: ninguém consegue abrir o painel dentro
 *   de um iframe em outro site (clickjacking — fazer o lojista clicar sem ver);
 * - nosniff: o navegador não "adivinha" tipo de arquivo;
 * - Referrer-Policy: links pra fora não levam o caminho completo do painel;
 * - Permissions-Policy: o site não pede câmera, microfone nem localização.
 * O HSTS a Vercel já manda.
 */
const securityHeaders = [
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
