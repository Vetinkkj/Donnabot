"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu, MessageCircle, Play, ShoppingBag, X, Zap } from "lucide-react";
import { PRICING } from "@/lib/marketing-config";
import { CTA, Eyebrow, Logo } from "./primitives";
import { Bubble, ChatHeader, Typing, Window } from "./mockups";

const links = [
  ["Como funciona", "/#como-funciona"],
  ["Funcionalidades", "/#funcionalidades"],
  ["Demonstração", "/#demonstracao"],
  ["Avaliações", "/#avaliacoes"],
  ["Planos", "/#planos"],
] as const;

export function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 12);
    f();
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);
  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled || open ? "glass border-b border-border" : "border-b border-transparent"}`}>
      <nav className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-5 sm:px-8 xl:gap-8" aria-label="Principal">
        <Link href="/" aria-label="Donnabot, início"><Logo /></Link>
        <ul className="hidden items-center gap-5 lg:flex xl:gap-7">
          {links.map(([l, h]) => (
            <li key={h}><a href={h} className="whitespace-nowrap text-sm text-muted-foreground transition-colors hover:text-foreground">{l}</a></li>
          ))}
        </ul>
        <div className="ml-auto hidden items-center gap-2 lg:flex">
          <a href="/login" className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">Entrar</a>
          <CTA href="/#cadastro" className="h-10 whitespace-nowrap px-5">Começar agora</CTA>
        </div>
        <button className="ml-auto grid size-10 place-items-center rounded-full border border-border lg:hidden" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Abrir menu">
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>
      {open && (
        <div className="border-t border-border px-5 pb-6 pt-2 lg:hidden">
          {links.map(([l, h]) => (
            <a key={h} href={h} onClick={() => setOpen(false)} className="block py-3 text-base text-muted-foreground">{l}</a>
          ))}
          <div className="mt-3 grid gap-2">
            <CTA href="/login" variant="ghost">Entrar</CTA>
            <CTA href="/#cadastro">Começar agora</CTA>
          </div>
        </div>
      )}
    </header>
  );
}

function HeroMockup() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const onMove = (e: PointerEvent) => {
      const x = e.clientX / window.innerWidth - 0.5;
      const y = e.clientY / window.innerHeight - 0.5;
      el.style.setProperty("--rx", `${8 - y * 6}deg`);
      el.style.setProperty("--ry", `${-14 + x * 8}deg`);
      el.style.setProperty("--px", `${x * 16}px`);
      el.style.setProperty("--py", `${y * 16}px`);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-[560px] [perspective:1600px]" aria-hidden="true">
      <div className="absolute -inset-10 rounded-full bg-glow blur-2xl" />
      <div
        ref={ref}
        className="relative transition-transform duration-500 ease-out [transform-style:preserve-3d]"
        style={{ transform: "rotateX(var(--rx,8deg)) rotateY(var(--ry,-14deg))" }}
      >
        {/* Back: dashboard */}
        <Window title="painel.donnabot" className="absolute -left-4 top-8 hidden w-[78%] sm:block [transform:translateZ(-80px)] opacity-80">
          <div className="grid grid-cols-3 gap-2 p-3">
            {[["Conversas", "Hoje"], ["Em atendimento", "Agora"], ["Produtos", "Catálogo"]].map(([a, b]) => (
              <div key={a} className="rounded-lg border border-border bg-card p-2.5">
                <p className="text-[10px] text-muted-foreground">{b}</p>
                <p className="mt-1 text-xs font-medium">{a}</p>
                <div className="mt-2 h-1.5 rounded-full bg-muted"><div className="h-full w-2/3 rounded-full bg-primary/70" /></div>
              </div>
            ))}
          </div>
          <div className="space-y-1.5 px-3 pb-24">
            {["Ana • Capinha iPhone 13", "Lucas • Carregador Turbo", "Bia • Prazo de entrega"].map((t, i) => (
              <div key={t} className="flex items-center gap-2 rounded-lg bg-card/60 px-2.5 py-2 text-[11px]">
                <span className={`size-1.5 rounded-full ${i === 2 ? "bg-muted-foreground" : "bg-primary"}`} />{t}
              </div>
            ))}
          </div>
        </Window>

        {/* Front: chat */}
        <Window title="WhatsApp • Sua loja" className="relative ml-auto w-[88%] sm:w-[70%] [transform:translateZ(40px)]">
          <ChatHeader name="Marina" />
          <div className="space-y-2.5 p-4">
            <Bubble from="client">Oi! Vocês têm capinha pro iPhone 13?</Bubble>
            <Bubble from="donna" delay={400}>
              {"Temos algumas opções 🙂\n🛡️ Capinha Silicone iPhone 13 — R$ 39,90\n🛡️ Capinha Anti-impacto iPhone 13 — R$ 49,90\nQual delas você quer?"}
            </Bubble>
            <Bubble from="client" delay={900}>Quero a de silicone</Bubble>
            <Typing />
          </div>
        </Window>

        {/* Floating chips */}
        <div className="absolute -left-2 bottom-10 animate-float-a [transform:translateZ(120px)]" style={{ translate: "var(--px,0) var(--py,0)" }}>
          <div className="glass flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs shadow-elegant">
            <span className="grid size-7 place-items-center rounded-lg bg-primary/15 text-primary"><MessageCircle className="size-4" /></span>
            Resposta enviada
          </div>
        </div>
        <div className="absolute right-6 -top-8 animate-float-b [transform:translateZ(140px)]">
          <div className="glass flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs shadow-elegant">
            <span className="grid size-7 place-items-center rounded-lg bg-primary/15 text-primary"><ShoppingBag className="size-4" /></span>
            Produto recomendado
          </div>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section id="topo" className="relative overflow-hidden pb-20 pt-32 sm:pt-40 lg:pb-32">
      <div className="grid-bg pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-glow blur-3xl" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-5 sm:px-8 lg:grid-cols-[1.05fr_1fr]">
        <div className="reveal">
          <Eyebrow>Seu novo vendedor no WhatsApp</Eyebrow>
          <h1 className="mt-6 text-balance text-[2.6rem] font-semibold leading-[1.04] tracking-[-0.035em] sm:text-6xl xl:text-7xl">
            Sua loja vende. A Donna <span className="text-gradient">conversa, atende</span> e ajuda a vender.
          </h1>
          <p className="mt-6 max-w-xl text-pretty text-lg text-muted-foreground">
            Automatize o atendimento da sua loja de peças e acessórios de celular pelo WhatsApp: capinhas, carregadores, películas, fones e muito mais, direto na conversa.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <CTA href="#cadastro">Testar por {PRICING.refundDays} dias com garantia <ArrowRight className="size-4" /></CTA>
            <CTA href="#demonstracao" variant="ghost"><Play className="size-4" /> Ver demonstração</CTA>
          </div>
          <p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
            <Zap className="size-4 text-primary" /> {PRICING.refundDays} dias para testar com reembolso garantido • Conheça a plataforma sem risco
          </p>
        </div>
        <HeroMockup />
      </div>
    </section>
  );
}
