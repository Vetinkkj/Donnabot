"use client";

import { useState } from "react";
import { LayoutDashboard, MessagesSquare, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/cn";
import { SectionHead } from "./primitives";
import { Bubble, ChatHeader, ProductCard, Window } from "./mockups";

const tabs = [
  { id: "atendimento", label: "Atendimento automatizado", icon: MessagesSquare, desc: "O cliente pergunta, a Donna consulta seu estoque, monta o carrinho e passa a conversa para sua equipe fechar o pagamento." },
  { id: "produtos", label: "Apresentação de produtos", icon: ShoppingBag, desc: "Foto, nome, preço e estoque da peça direto na conversa, com botões para o cliente seguir." },
  { id: "gestao", label: "Experiência de gestão", icon: LayoutDashboard, desc: "Uma visão organizada das conversas, de quem está esperando atendimento e dos produtos." },
] as const;

/** Botões de resposta rápida, como a Donna manda no WhatsApp. */
function QuickReplies({ options, delay }: { options: string[]; delay: number }) {
  return (
    <div className="flex flex-wrap justify-end gap-2 animate-msg-in" style={{ animationDelay: `${delay}ms` }}>
      {options.map((o) => (
        <span key={o} className="rounded-full border border-primary/30 px-3 py-1 text-xs text-primary">{o}</span>
      ))}
    </div>
  );
}

function Atendimento() {
  return (
    <Window title="WhatsApp • Demonstração" className="mx-auto max-w-md">
      <ChatHeader name="Rafael" />
      <div className="space-y-2.5 p-5">
        <Bubble from="client">Boa tarde! Tem capinha pro Galaxy S23?</Bubble>
        <Bubble from="donna" delay={300}>Tem sim! 📱 Capinha Galaxy S23 — R$ 39,90 • 📦 12 em estoque</Bubble>
        <QuickReplies options={["🛒 Adicionar"]} delay={500} />
        <Bubble from="client" delay={800}>🛒 Adicionar</Bubble>
        <Bubble from="donna" delay={1100}>✅ Adicionado ao carrinho! Total: R$ 39,90</Bubble>
        <QuickReplies options={["Finalizar carrinho"]} delay={1300} />
        <Bubble from="client" delay={1600}>Finalizar carrinho</Bubble>
        <Bubble from="donna" delay={1900}>Pedido #A1B2C3 separado! Vou te passar para um atendente, que já te envia o link de pagamento 🙋‍♀️</Bubble>
      </div>
    </Window>
  );
}

function Produtos() {
  return (
    <Window title="WhatsApp • Demonstração" className="mx-auto max-w-lg">
      <ChatHeader name="Juliana" />
      <div className="space-y-3 p-5">
        <Bubble from="client">Tem carregador turbo 25W?</Bubble>
        <div className="flex justify-end animate-msg-in" style={{ animationDelay: "300ms" }}>
          <ProductCard name="Carregador Turbo 25W" price="R$ 59,90" i={0} />
        </div>
        <Bubble from="donna" delay={600}>Tem sim! 📦 5 em estoque. Para levar, toque em &quot;Adicionar&quot; 👇</Bubble>
        <QuickReplies options={["🛒 Adicionar"]} delay={800} />
        <Bubble from="client" delay={1100}>Tem bateria?</Bubble>
        <Bubble from="donna" delay={1400}>
          Temos algumas opções 🙂 🔋 Bateria iPhone 11 — R$ 180,00 • 🔋 Bateria Galaxy A12 — R$ 120,00. Qual delas você quer?
        </Bubble>
      </div>
    </Window>
  );
}

function Gestao() {
  const rows = [
    ["Juliana", "Carregador Turbo 25W", "Donna atendendo"],
    ["Rafael", "Pedido #A1B2C3", "Aguardando atendente"],
    ["Carla", "Capinha iPhone 13", "Em atendimento"],
    ["Pedro", "Película 3D", "Donna atendendo"],
  ];
  return (
    <Window title="painel.donnabot • Demonstração" className="mx-auto max-w-2xl">
      <div className="grid gap-3 p-5 sm:grid-cols-3">
        {[["Conversas abertas", "4"], ["Aguardando atendente", "1"], ["Produtos cadastrados", "38"]].map(([a, b]) => (
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
              <span className={cn("rounded-full px-2.5 py-0.5 text-[11px]", s === "Donna atendendo" ? "bg-primary/15 text-primary" : s === "Em atendimento" ? "bg-muted text-muted-foreground" : "bg-accent text-accent-foreground")}>{s}</span>
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
