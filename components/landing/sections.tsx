import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  ChevronDown,
  Clock,
  Eye,
  FileText,
  Handshake,
  LayoutGrid,
  MessageCircle,
  MessagesSquare,
  Repeat,
  ShoppingCart,
  Smartphone,
  Store,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { CONTACT_EMAIL, PRICING } from "@/lib/marketing-config";
import { CTA, Logo, SectionHead, TiltCard } from "./primitives";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const benefits = [
  { icon: MessageCircle, t: "Atendimento no WhatsApp", d: "A Donna responde seus clientes no canal onde eles já conversam com a sua loja." },
  { icon: LayoutGrid, t: "Produtos bem apresentados", d: "Fotos, nomes e preços organizados direto na conversa." },
  { icon: Clock, t: "Respostas mais ágeis", d: "Menos cliente esperando enquanto você cuida da loja." },
  { icon: ShoppingCart, t: "Apoio às vendas", d: "A conversa segue do interesse até a escolha do produto." },
  { icon: Repeat, t: "Atendimento consistente", d: "O mesmo cuidado em cada conversa, todos os dias." },
  { icon: Wrench, t: "Configuração assistida", d: "Nossa equipe ajuda a conectar o WhatsApp e cadastrar os produtos." },
];

export function Benefits() {
  return (
    <section id="funcionalidades" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHead
          eyebrow="Funcionalidades"
          title={
            <>
              Mais tempo para sua loja. <span className="text-muted-foreground">Menos trabalho repetitivo.</span>
            </>
          }
        />
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((b, i) => (
            <div key={b.t} className="reveal" style={{ transitionDelay: `${i * 60}ms` }}>
              <TiltCard className="h-full p-7">
                <span className="grid size-11 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                  <b.icon className="size-5" />
                </span>
                <h3 className="mt-6 text-lg font-semibold tracking-tight">{b.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{b.d}</p>
              </TiltCard>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const steps = [
  { icon: Store, t: "Crie sua conta", d: "Cadastre sua loja em poucos minutos." },
  { icon: Handshake, t: "Configure sua experiência", d: "Escolha seu plano e fale com nossa equipe para preparar sua loja." },
  { icon: Smartphone, t: "Conecte seu WhatsApp", d: "Conclua a configuração com nossa equipe e prepare a Donna para atender seus clientes." },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="relative border-y border-border bg-surface/40 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHead eyebrow="Como funciona" title="Três etapas para a Donna começar a atender." />
        <ol className="relative mt-16 grid gap-10 lg:grid-cols-3 lg:gap-6">
          <div
            aria-hidden
            className="absolute bottom-7 left-7 top-7 w-px bg-linear-to-b from-primary/60 via-primary/20 to-transparent lg:inset-x-[16%] lg:bottom-auto lg:top-7 lg:h-px lg:w-auto lg:bg-linear-to-r"
          />
          {steps.map((s, i) => (
            <li
              key={s.t}
              className="reveal relative flex gap-6 lg:flex-col lg:items-center lg:text-center"
              style={{ transitionDelay: `${i * 120}ms` }}
            >
              <span className="relative z-10 grid size-14 shrink-0 place-items-center rounded-2xl border border-primary/30 bg-background text-primary shadow-glow">
                <s.icon className="size-6" />
              </span>
              <div>
                <p className="font-mono text-xs tracking-[0.2em] text-primary">ETAPA 0{i + 1}</p>
                <h3 className="mt-2 text-xl font-semibold tracking-tight">{s.t}</h3>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">{s.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const trust = [
  { icon: MessagesSquare, t: "Feita para o WhatsApp", d: "Foco total em atendimento e vendas no canal que seus clientes já usam.", big: true },
  { icon: Wrench, t: "Configuração assistida", d: "Você não começa sozinho: a equipe ajuda na conexão e no cadastro." },
  { icon: Eye, t: "Veja antes de decidir", d: "Demonstração visual de como a Donna conversa." },
  { icon: CalendarCheck, t: `${PRICING.refundDays} dias de garantia`, d: "Teste na sua loja; se não gostar, devolvemos o valor pago." },
  { icon: FileText, t: "Planos claros", d: "Dois planos, preços abertos e processo de contratação explicado.", big: true },
];

export function Trust() {
  return (
    <section id="avaliacoes" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHead
          eyebrow="Por que a Donnabot"
          title="Uma nova experiência para atender seus clientes."
          sub="As primeiras avaliações de lojistas vão aparecer aqui. Enquanto isso, veja o que você já pode esperar."
        />
        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {trust.map((c, i) => (
            <div key={c.t} className={cn("reveal", c.big && "md:col-span-2")} style={{ transitionDelay: `${i * 60}ms` }}>
              <TiltCard className="flex h-full flex-col justify-between gap-10 p-7">
                <c.icon className="size-6 text-primary" />
                <div>
                  <h3 className={cn("font-semibold tracking-tight", c.big ? "text-2xl" : "text-lg")}>{c.t}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{c.d}</p>
                </div>
              </TiltCard>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const yearlySavings = PRICING.monthly * 12 - PRICING.yearly;

const faq: [string, string][] = [
  [
    "Como funciona a Donnabot?",
    "A Donna atende os clientes da sua loja pelo WhatsApp: responde perguntas, apresenta seus produtos — capinhas, carregadores, películas, fones e outros acessórios — e ajuda a conversa a avançar até a venda.",
  ],
  ["Como conecto meu WhatsApp?", "Depois do cadastro e da ativação do plano, nossa equipe te ajuda a conectar o número da loja."],
  [
    "Preciso cadastrar meus produtos?",
    "Sim, a Donna precisa conhecer seus produtos — capinhas, carregadores, películas, fones e mais — para apresentá-los. A equipe ajuda você nesse cadastro.",
  ],
  [
    `Como funciona a garantia de ${PRICING.refundDays} dias?`,
    `Você contrata o plano e tem ${PRICING.refundDays} dias para testar a Donna na sua loja. Se não gostar, é só pedir o reembolso pelo nosso e-mail dentro desse prazo e devolvemos o valor integral.`,
  ],
  [
    "Qual é a diferença entre os planos?",
    `A forma de pagamento: o mensal custa ${currency.format(PRICING.monthly)} por mês e o anual ${currency.format(PRICING.yearly)} por ano, uma economia de ${currency.format(yearlySavings)} em relação a 12 mensalidades.`,
  ],
  ["Como faço para começar?", "Crie sua conta, escolha o plano e fale com a gente para preparar sua loja. Leva poucos minutos."],
];

// Só na página /duvidas, além das de cima.
const faqExtra: [string, string][] = [
  [
    "Como o cliente paga?",
    "Quando o cliente finaliza o carrinho, a Donna passa a conversa para alguém da sua loja, com o pedido já montado. Sua equipe envia o link ou a chave de pagamento e marca o pedido como pago no painel — o estoque é atualizado na hora.",
  ],
  [
    "Funciona no WhatsApp que eu já uso no celular?",
    "Sim, se for o WhatsApp Business: você continua usando o app no celular normalmente e a Donna atende pelo mesmo número. Quem usa o WhatsApp comum precisa migrar para o WhatsApp Business antes (é grátis e mantém as conversas). Também dá para usar um número novo só para a Donna.",
  ],
  [
    "E se eu responder o cliente pelo celular?",
    "A Donna percebe e fica em silêncio naquela conversa, para vocês não responderem ao mesmo tempo. Se ninguém da loja responder em 2 horas, ela volta a atender quando o cliente escrever de novo.",
  ],
  [
    "Preciso saber programar ou mexer em código?",
    "Não. Você conecta o WhatsApp em um clique, autorizando pela sua conta da Meta (a mesma empresa do WhatsApp), e cadastra seus produtos no painel ou por planilha.",
  ],
  [
    "Meus dados e os dos meus clientes ficam seguros?",
    "Sim. Senhas e credenciais ficam criptografadas, os dados de uma loja nunca são compartilhados com outra e você pode pedir a exclusão a qualquer momento. Veja a Política de Privacidade.",
  ],
  [
    "Quanto tempo leva para minha loja ficar no ar?",
    "Normalmente no mesmo dia em que confirmamos o plano: o cadastro é liberado pela nossa equipe, que ajuda a conectar o WhatsApp e cadastrar os produtos.",
  ],
  ["Tem fidelidade?", "Não. Você pode cancelar quando quiser pelo nosso e-mail de contato."],
];

export function FAQ({ all = false }: { all?: boolean }) {
  const items = all ? [...faq, ...faqExtra] : faq;
  return (
    <section id="duvidas" className="py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        <SectionHead eyebrow="Dúvidas" title="Perguntas frequentes" />
        <div className="reveal mt-12 space-y-3">
          {items.map(([q, a]) => (
            <details
              key={q}
              name="faq"
              className="overflow-hidden rounded-2xl border border-border bg-card/40 transition-colors open:border-primary/30"
            >
              <summary className="flex w-full cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-left font-medium">
                {q}
                <ChevronDown className="faq-chevron size-4 shrink-0 text-muted-foreground transition-transform duration-300" />
              </summary>
              <p className="px-6 pb-5 text-sm leading-relaxed text-muted-foreground">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/** `href`: na página inicial rola até o formulário; nas outras páginas vai para /signup. */
export function FinalCTA({ href = "#cadastro" }: { href?: string }) {
  return (
    <section className="px-5 pb-24 sm:px-8">
      <div className="reveal relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-primary/25 bg-surface px-6 py-20 text-center sm:px-16">
        <div className="pointer-events-none absolute inset-0 bg-glow" />
        <div className="grid-bg pointer-events-none absolute inset-0" />
        <div className="relative">
          <h2 className="mx-auto max-w-3xl text-balance text-3xl font-semibold tracking-tight sm:text-5xl">
            Sua próxima conversa pode começar <span className="text-gradient">com a Donna.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
            Conheça uma nova forma de vender capinhas, carregadores e acessórios pelo WhatsApp.
          </p>
          <CTA href={href} className="mt-9">
            Começar agora <ArrowRight className="size-4" />
          </CTA>
          <p className="mt-4 text-sm text-muted-foreground">{PRICING.refundDays} dias de garantia com reembolso</p>
        </div>
      </div>
    </section>
  );
}

const footerLinks: [string, string][] = [
  ["Como funciona", "/#como-funciona"],
  ["Demonstração", "/#demonstracao"],
  ["Planos", "/#planos"],
  ["Dúvidas", "/duvidas"],
  ["Entrar", "/login"],
];

const legalLinks: [string, string][] = [
  ["Termos de Uso", "/termos"],
  ["Privacidade", "/privacidade"],
  ["Exclusão de dados", "/exclusao-de-dados"],
];

export function Footer() {
  return (
    <footer className="border-t border-border py-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 sm:px-8 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-3">
          <Logo />
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-sm text-muted-foreground hover:text-foreground">
            {CONTACT_EMAIL}
          </a>
        </div>
        <nav className="flex flex-col gap-3 text-sm text-muted-foreground" aria-label="Rodapé">
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            {footerLinks.map(([l, h]) => (
              <a key={h} href={h} className="hover:text-foreground">
                {l}
              </a>
            ))}
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            {legalLinks.map(([l, h]) => (
              <Link key={h} href={h} className="hover:text-foreground">
                {l}
              </Link>
            ))}
          </div>
        </nav>
        <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Donnabot</p>
      </div>
    </footer>
  );
}
