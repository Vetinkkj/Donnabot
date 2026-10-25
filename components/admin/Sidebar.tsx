"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessagesSquare,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Receipt,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { BRAND_NAME } from "@/lib/marketing-config";
import { SIDEBAR_COOKIE } from "@/lib/ui-prefs";

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard };

const MAIN_NAV: NavItem[] = [
  { href: "/dashboard", label: "Visão geral", icon: LayoutDashboard },
  { href: "/conversations", label: "Atendimento", icon: MessagesSquare },
  { href: "/orders", label: "Pedidos", icon: Receipt },
  { href: "/products", label: "Produtos", icon: Package },
  { href: "/customers", label: "Clientes", icon: Users },
];
const ACCOUNT_NAV: NavItem[] = [{ href: "/settings", label: "Configurações", icon: Settings }];
const PLATFORM_NAV: NavItem[] = [{ href: "/platform", label: "Administração", icon: ShieldCheck }];


function initials(label?: string | null) {
  const parts = (label ?? "").replace(/@.*/, "").split(/[\s._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "D";
}

function NavLink({ item, active, collapsed }: { item: NavItem; active: boolean; collapsed: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      title={collapsed ? item.label : undefined}
      className={cn(
        "relative flex shrink-0 items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-emerald-500",
        collapsed && "md:justify-center md:px-0",
        active ? "bg-white/[0.07] text-zinc-50" : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100"
      )}
    >
      {/* Indicador da página ativa: forma + cor, não só cor */}
      {active && <span className="absolute inset-y-2 left-0 hidden w-[3px] rounded-r-full bg-emerald-400 md:block" aria-hidden />}
      <Icon className={cn("size-[18px] shrink-0", active ? "text-emerald-400" : "text-zinc-500")} aria-hidden />
      <span className={cn(collapsed && "md:sr-only")}>{item.label}</span>
    </Link>
  );
}

function NavGroup({ label, items, pathname, collapsed }: { label: string; items: NavItem[]; pathname: string; collapsed: boolean }) {
  return (
    <div className="flex shrink-0 gap-1 md:flex-col">
      <p
        className={cn(
          "hidden px-3 pb-1 pt-4 text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-600 md:block",
          collapsed && "md:sr-only"
        )}
      >
        {label}
      </p>
      {items.map((item) => (
        <NavLink key={item.href} item={item} active={pathname.startsWith(item.href)} collapsed={collapsed} />
      ))}
    </div>
  );
}

export function Sidebar({
  userLabel,
  footer,
  isPlatformAdmin,
  initialCollapsed = false,
}: {
  userLabel?: string | null;
  footer?: ReactNode;
  isPlatformAdmin?: boolean;
  initialCollapsed?: boolean;
}) {
  const pathname = usePathname() ?? "";
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `${SIDEBAR_COOKIE}=${next ? "collapsed" : "expanded"}; path=/; max-age=31536000; samesite=lax`;
  }

  return (
    <nav
      aria-label="Navegação do painel"
      data-collapsed={collapsed}
      className={cn(
        "group/sidebar sticky top-0 z-40 flex shrink-0 flex-col border-b border-white/[0.06] bg-zinc-950/90 backdrop-blur md:h-screen md:border-b-0 md:border-r md:bg-zinc-950 md:transition-[width] md:duration-200",
        collapsed ? "md:w-[68px]" : "md:w-60"
      )}
    >
      <div className={cn("flex items-center gap-2.5 px-4 pt-3 md:h-16 md:pt-0", collapsed && "md:justify-center md:px-0")}>
        <span className="relative block size-8 shrink-0 overflow-hidden rounded-lg bg-black ring-1 ring-white/10">
          <Image src="/logo-icon.png" alt="" fill sizes="32px" className="object-cover" />
        </span>
        <span className={cn("text-[15px] font-semibold tracking-tight text-zinc-50", collapsed && "md:sr-only")}>{BRAND_NAME}</span>
        {/* No celular a barra vira um topo: o "Sair" fica no canto. */}
        <div className="ml-auto md:hidden">{footer}</div>
      </div>

      <div className="flex gap-1 overflow-x-auto px-3 py-2 [scrollbar-width:none] md:flex-1 md:flex-col md:overflow-x-visible md:overflow-y-auto md:py-1">
        <NavGroup label="Loja" items={MAIN_NAV} pathname={pathname} collapsed={collapsed} />
        <NavGroup label="Conta" items={ACCOUNT_NAV} pathname={pathname} collapsed={collapsed} />
        {isPlatformAdmin && <NavGroup label="Plataforma" items={PLATFORM_NAV} pathname={pathname} collapsed={collapsed} />}
      </div>

      <div className="hidden flex-col gap-1 border-t border-white/[0.06] p-3 md:flex">
        {userLabel && (
          <div className={cn("flex items-center gap-2.5 px-2 py-1.5", collapsed && "justify-center px-0")} title={collapsed ? userLabel : undefined}>
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-emerald-500/15 text-[11px] font-semibold text-emerald-300">
              {initials(userLabel)}
            </span>
            <span className={cn("truncate text-xs text-zinc-400", collapsed && "sr-only")}>{userLabel}</span>
          </div>
        )}
        {footer}
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Expandir barra lateral" : "Recolher barra lateral"}
          title={collapsed ? "Expandir" : "Recolher"}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-200 focus-visible:outline-2 focus-visible:outline-emerald-500",
            collapsed && "justify-center px-0"
          )}
        >
          {collapsed ? <PanelLeftOpen className="size-[18px]" aria-hidden /> : <PanelLeftClose className="size-[18px]" aria-hidden />}
          <span className={cn(collapsed && "sr-only")}>Recolher</span>
        </button>
      </div>
    </nav>
  );
}
