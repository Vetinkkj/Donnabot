import { ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md";

// Padrão do painel (tema escuro): verde da Donna só na ação principal de cada tela.
const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-emerald-500 font-semibold text-emerald-950 hover:bg-emerald-400",
  secondary: "border border-white/10 bg-white/[0.04] text-zinc-100 hover:bg-white/[0.08]",
  danger: "border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20",
  ghost: "text-zinc-400 hover:bg-white/5 hover:text-zinc-100",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "h-8 rounded-lg px-3 text-[13px]",
  md: "h-10 rounded-lg px-4 text-sm",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  /** Mostra o indicador de processamento e bloqueia novos cliques. */
  loading?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading = false, className = "", disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn(
          "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap font-medium transition-all active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:pointer-events-none disabled:opacity-50",
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
