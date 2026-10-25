// Tipos, rótulos e formatação compartilhados pela tela de Atendimento.

export type ConversationStatus = "BOT" | "WAITING_HUMAN" | "HUMAN";

export type ConversationListItem = {
  id: string;
  status: ConversationStatus;
  lastMessageAt: string;
  customer: { id: string; name: string | null; whatsappPhone: string };
  assignedUser: { id: string; name: string } | null;
  lastMessage: string | null;
};

export type Message = {
  id: string;
  direction: "IN" | "OUT";
  content: string;
  messageType: "TEXT" | "BUTTONS" | "IMAGE";
  createdAt: string;
};

export type ConversationDetail = {
  id: string;
  status: ConversationStatus;
  customer: { id: string; name: string | null; whatsappPhone: string };
  assignedUser: { id: string; name: string } | null;
  messages: Message[];
};

/** Quem está respondendo a conversa agora. `tone` segue o Badge (ponto + texto, nunca só cor). */
export const STATUS_META: Record<ConversationStatus, { label: string; short: string; tone: "warning" | "success" | "neutral" }> = {
  WAITING_HUMAN: { label: "Aguardando atendente", short: "Aguardando", tone: "warning" },
  HUMAN: { label: "Com atendente", short: "Atendente", tone: "success" },
  BOT: { label: "Donna atendendo", short: "Donna", tone: "neutral" },
};

const SP = "America/Sao_Paulo";
const timeFmt = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: SP });
const dayKeyFmt = new Intl.DateTimeFormat("en-CA", { timeZone: SP });
const shortDateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone: SP });
const longDateFmt = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long", timeZone: SP });

export function formatTime(iso: string) {
  return timeFmt.format(new Date(iso));
}

function dayKey(date: Date) {
  return dayKeyFmt.format(date);
}

/** Horário compacto da lista: "14:32", "Ontem" ou "21/10". */
export function formatListTime(iso: string) {
  const date = new Date(iso);
  const today = dayKey(new Date());
  const yesterday = dayKey(new Date(Date.now() - 86_400_000));
  const key = dayKey(date);
  if (key === today) return timeFmt.format(date);
  if (key === yesterday) return "Ontem";
  return shortDateFmt.format(date);
}

/** Separador de dia na conversa: "Hoje", "Ontem" ou "terça-feira, 21 de outubro". */
export function formatDaySeparator(iso: string) {
  const key = dayKey(new Date(iso));
  if (key === dayKey(new Date())) return "Hoje";
  if (key === dayKey(new Date(Date.now() - 86_400_000))) return "Ontem";
  const text = longDateFmt.format(new Date(iso));
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function sameDay(a: string, b: string) {
  return dayKey(new Date(a)) === dayKey(new Date(b));
}

export function displayName(customer: { name: string | null; whatsappPhone: string }) {
  return customer.name?.trim() || formatPhone(customer.whatsappPhone);
}

/** "5521999998888" → "+55 21 99999-8888" (números de outros formatos ficam como vieram). */
export function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const match = digits.match(/^55(\d{2})(\d{4,5})(\d{4})$/);
  return match ? `+55 ${match[1]} ${match[2]}-${match[3]}` : phone.startsWith("+") ? phone : `+${digits}`;
}

/**
 * Mensagens com botões são gravadas como "texto\n[Botão 1] [Botão 2]" e as
 * com foto como "📷 legenda\nURL". Aqui separamos as partes para exibir.
 */
export function parseMessage(message: Message): { text: string; buttons: string[]; imageUrl: string | null } {
  if (message.messageType === "IMAGE") {
    const lines = message.content.split("\n");
    const url = lines.find((line) => /^https?:\/\//.test(line.trim())) ?? null;
    const text = lines
      .filter((line) => line !== url)
      .join("\n")
      .replace(/^📷\s*/, "");
    return { text, buttons: [], imageUrl: url?.trim() ?? null };
  }
  if (message.messageType === "BUTTONS") {
    const lines = message.content.split("\n");
    const last = lines[lines.length - 1] ?? "";
    const buttons = [...last.matchAll(/\[([^\]]+)\]/g)].map((m) => m[1]);
    if (buttons.length) return { text: lines.slice(0, -1).join("\n"), buttons, imageUrl: null };
  }
  return { text: message.content, buttons: [], imageUrl: null };
}
