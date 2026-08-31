"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BRAND_NAME } from "@/lib/marketing-config";

const TABS = [
  { href: "/", label: "Como funciona" },
  { href: "/signup", label: "Cadastre sua loja" },
  { href: "/duvidas", label: "Dúvidas" },
];

export function MarketingNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-black/80">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 md:flex-nowrap md:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50"
        >
          <span aria-hidden>🤖</span> {BRAND_NAME}
        </Link>

        <Link
          href="/login"
          className="order-2 ml-auto shrink-0 rounded-full bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 md:order-3"
        >
          Entrar
        </Link>

        <nav className="order-3 flex w-full gap-1 overflow-x-auto md:order-2 md:w-auto md:flex-1">
          {TABS.map((tab) => {
            const active = tab.href === "/" ? pathname === "/" : pathname?.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-[#25D366]/15 text-[#0f7a3d] dark:bg-[#25D366]/20 dark:text-[#25D366]"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
