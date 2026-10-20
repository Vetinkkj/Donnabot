"use client";

import { useEffect, useRef, type PointerEvent, type ReactNode } from "react";
import Image from "next/image";
import { cn } from "@/lib/cn";
import { BRAND_NAME } from "@/lib/marketing-config";

/** Liga a animação de "aparecer ao rolar" (classe .reveal) na página. */
export function RevealOnScroll() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".reveal");
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null;
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 font-semibold tracking-tight", className)}>
      <span className="relative block size-8 overflow-hidden rounded-xl bg-black shadow-glow">
        <Image src="/logo-icon.png" alt="" fill sizes="32px" className="object-cover" />
      </span>
      {BRAND_NAME}
    </span>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-primary">
      <span className="size-1.5 rounded-full bg-primary animate-pulse-dot" />
      {children}
    </span>
  );
}

export function SectionHead({ eyebrow, title, sub }: { eyebrow: string; title: ReactNode; sub?: string }) {
  return (
    <div className="reveal mx-auto max-w-2xl text-center">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-5 text-balance text-3xl font-semibold tracking-tight sm:text-5xl">{title}</h2>
      {sub && <p className="mt-4 text-pretty text-base text-muted-foreground sm:text-lg">{sub}</p>}
    </div>
  );
}

const btn = {
  primary: "bg-gradient-primary text-primary-foreground shadow-glow hover:brightness-110 hover:-translate-y-0.5",
  ghost: "border border-border bg-foreground/[0.03] text-foreground hover:bg-foreground/[0.07] hover:border-foreground/20",
};

export function CTA({
  href,
  variant = "primary",
  children,
  className,
}: {
  href: string;
  variant?: keyof typeof btn;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={cn(
        "inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold transition-all duration-300 active:scale-[0.98]",
        btn[variant],
        className,
      )}
    >
      {children}
    </a>
  );
}

/** Card com brilho que segue o mouse e leve inclinação 3D. */
export function TiltCard({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--mx", `${x * 100}%`);
    el.style.setProperty("--my", `${y * 100}%`);
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      el.style.transform = `perspective(900px) rotateX(${(0.5 - y) * 4}deg) rotateY(${(x - 0.5) * 4}deg)`;
  };
  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={() => {
        if (ref.current) ref.current.style.transform = "";
      }}
      className={cn(
        "spotlight rounded-2xl border border-border bg-card/60 bg-gradient-card transition-[transform,border-color] duration-300 hover:border-primary/25",
        className,
      )}
    >
      {children}
    </div>
  );
}
