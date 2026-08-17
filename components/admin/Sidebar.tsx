"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/products", label: "Produtos" },
  { href: "/orders", label: "Pedidos" },
  { href: "/conversations", label: "Atendimento" },
  { href: "/customers", label: "Clientes" },
  { href: "/settings", label: "Configurações" },
];

export function Sidebar({ userLabel, footer }: { userLabel?: string | null; footer?: ReactNode }) {
  const pathname = usePathname();

  return (
    <nav className="flex shrink-0 flex-col gap-1 border-b border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950 md:h-screen md:w-56 md:border-b-0 md:border-r">
      <div className="mb-4 hidden px-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50 md:block">
        BOTloja
      </div>
      <div className="flex gap-1 overflow-x-auto md:flex-col md:overflow-x-visible">
        {NAV_ITEMS.map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                  : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
      <div className="mt-auto flex flex-col gap-1 border-t border-zinc-200 pt-3 dark:border-zinc-800">
        {userLabel && <span className="truncate px-3 text-xs text-zinc-500">{userLabel}</span>}
        {footer}
      </div>
    </nav>
  );
}
