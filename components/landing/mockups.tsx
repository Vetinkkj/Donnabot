import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Window({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-2xl border border-border bg-surface shadow-elegant", className)}>
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-foreground/15" />
        <span className="size-2.5 rounded-full bg-foreground/15" />
        <span className="size-2.5 rounded-full bg-foreground/15" />
        <span className="ml-2 truncate font-mono text-[11px] text-muted-foreground">{title}</span>
      </div>
      {children}
    </div>
  );
}

export function Bubble({ from, children, delay = 0 }: { from: "client" | "donna"; children: ReactNode; delay?: number }) {
  return (
    <div
      className={cn("flex animate-msg-in", from === "donna" ? "justify-end" : "justify-start")}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className={cn(
          "max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2 text-[13px] leading-snug",
          from === "donna" ? "rounded-br-md bg-bubble-out" : "rounded-bl-md bg-bubble-in",
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function Typing() {
  return (
    <div className="flex justify-end">
      <div className="animate-typing flex gap-1 rounded-2xl rounded-br-md bg-bubble-out px-3.5 py-3">
        <span className="size-1.5 rounded-full bg-foreground" />
        <span className="size-1.5 rounded-full bg-foreground" />
        <span className="size-1.5 rounded-full bg-foreground" />
      </div>
    </div>
  );
}

export function ChatHeader({ name = "Cliente" }: { name?: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-3">
      <div className="grid size-8 place-items-center rounded-full bg-muted text-xs font-semibold">{name[0]}</div>
      <div className="min-w-0">
        <p className="text-sm font-medium">{name}</p>
        <p className="flex items-center gap-1.5 text-[11px] text-primary">
          <span className="size-1.5 rounded-full bg-primary animate-pulse-dot" /> Donna atendendo
        </p>
      </div>
      <span className="ml-auto rounded-full border border-border px-2 py-0.5 font-mono text-[10px] uppercase text-muted-foreground">
        Demo
      </span>
    </div>
  );
}
