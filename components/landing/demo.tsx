"use client";

import { useState } from "react";
import { LayoutDashboard, MessagesSquare, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/cn";
import { SectionHead } from "./primitives";
import { Bubble, ChatHeader, Window } from "./mockups";

const tabs = [
  { id: "atendimento", label: "Atendimento automatizado", icon: MessagesSquare, desc: "O cliente pergunta, a Donna responde com naturalidade e mantém a conversa andando." },
  { id: "produtos", label: "Apresentação de produtos", icon: ShoppingBag, desc: "Produtos com foto, nome e preço direto na conversa, com opções para o cliente seguir." },
  { id: "gestao", label: "Experiência de gestão", icon: LayoutDashboard, desc: "Uma visão organizada das conversas, do status de cada atendimento e dos produtos." },
] as const;

function Atendimento() {
  return (
    <Window title="WhatsApp • Demonstração" className="mx-auto max-w-md">
      <ChatHeader name="Rafael" />
      <div className="space-y-2.5 p-5">
        <Bubble from="client">Boa tarde! Tem capinha pro Galaxy S23?</Bubble>
        <Bubble from="donna" delay={300}>Sim! Temos disponível: 🛡️ Capinha Galaxy S23 • 💰 R$ 39,90 • 📦 Estoque: 12 unidades</Bubble>
        <Bubble from="donna" delay={600}>Para levar, toque em &quot;Adicionar&quot; 👇</Bubble>
        <Bubble from="client" delay={900}>🛒 Adicionar</Bubble>
      </div>
    </Window>
  );
}

function Produtos() {
  return (
    <Window title="WhatsApp • Demonstração" className="mx-auto max-w-lg">
      <ChatHeader name="Juliana" />
      <div className="space-y-3 p-5">
        <Bubble from="client">Tem carregador turbo?</Bubble>
        <Bubble from="donna" delay={300}>
          {"Temos algumas opções 🙂\n⚡ Carregador Turbo 25W — R$ 59,90\n⚡ Carregador Rápido 20W — R$ 44,90\n⚡ Carregador Dual USB — R$ 79,90\nQual delas você quer?"}
        </Bubble>
        <Bubble from="client" delay={700}>Quero o Turbo 25W</Bubble>
        <Bubble from="donna" delay={1000}>Sim! Temos disponível: ⚡ Carregador Turbo 25W • 💰 R$ 59,90 • 📦 Estoque: 5 unidades</Bubble>
        <Bubble from="donna" delay={1300}>Para levar, toque em &quot;Adicionar&quot; 👇</Bubble>
      </div>
    </Window>
  );
}

function Gestao() {
  const rows = [
    ["Juliana", "Capinha iPhone 13", "Em atendimento"],
    ["Rafael", "Carregador Turbo 25W", "Em atendimento"],
    ["Carla", "Prazo de entrega", "Aguardando loja"],
    ["Pedro", "Película 3D", "Finalizada"],
  ];
  return (
    <Window title="painel.donnabot • Demonstração" className="mx-auto max-w-2xl">
      <div className="grid gap-3 p-5 sm:grid-cols-3">
        {[["Conversas abertas", "4"], ["Aguardando loja", "1"], ["Produtos cadastrados", "38"]].map(([a, b]) => (
          <div key={a} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{a}</p>
            <p className="mt-1 font-mono text-2xl font-medium">{b}</p>
          </div>
        ))}
      </div>
      <div className="px-5 pb-5">
        <div className="overflow-hidden rounded-xl border border-border">
          {rows.map(([n, p, s], i) => (
            <div key={n} className={cn("grid grid-cols-[1fr_1fr_auto] items-center gap-3 px-4 py-3 text-sm", i && "border-t border-border")}>
              <span className="font-medium">{n}</span>
              <span className="truncate text-muted-foreground">{p}</span>
              <span className={cn("rounded-full px-2.5 py-0.5 text-[11px]", s === "Em atendimento" ? "bg-primary/15 text-primary" : s === "Finalizada" ? "bg-muted text-muted-foreground" : "bg-accent text-accent-foreground")}>{s}</span>
            </div>
          ))}
        </div>
      </div>
    </Window>
  );
}

export function Demo() {
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("atendimento");
  return (
    <section id="demonstracao" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHead eyebrow="Demonstração" title={<>Veja a Donna <span className="text-gradient">em ação.</span></>} sub="Uma experiência de atendimento mais rápida, organizada e preparada para ajudar sua loja a vender." />
        <div className="reveal mt-14 grid gap-10 lg:grid-cols-[360px_1fr] lg:items-center">
          <div role="tablist" aria-label="Demonstrações" className="grid gap-3">
            {tabs.map((t) => (
              <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
                className={cn("rounded-2xl border p-5 text-left transition-all duration-300", tab === t.id ? "border-primary/40 bg-primary/[0.07] shadow-glow" : "border-border bg-card/40 hover:border-foreground/20")}>
                <span className="flex items-center gap-3 font-medium">
                  <t.icon className={cn("size-5", tab === t.id ? "text-primary" : "text-muted-foreground")} />{t.label}
                </span>
                <p className="mt-2 text-sm text-muted-foreground">{t.desc}</p>
              </button>
            ))}
            <p className="px-1 text-xs text-muted-foreground">Conversas e dados fictícios, apenas para demonstração.</p>
          </div>
          <div key={tab} className="relative min-h-[420px] rounded-3xl border border-border bg-surface/50 p-4 sm:p-10 animate-msg-in" role="tabpanel">
            <div className="pointer-events-none absolute inset-0 rounded-3xl bg-glow opacity-60" />
            <div className="relative">{tab === "atendimento" ? <Atendimento /> : tab === "produtos" ? <Produtos /> : <Gestao />}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
