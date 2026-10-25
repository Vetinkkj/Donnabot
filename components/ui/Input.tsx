import { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes, forwardRef, useId } from "react";
import { cn } from "@/lib/cn";

/** Classes de campo do painel — exportadas para selects e campos especiais usarem o mesmo visual. */
export const fieldClass =
  "w-full rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-600 transition-colors focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60 aria-[invalid=true]:border-red-500/60";

type FieldProps = { label?: string; error?: string; hint?: ReactNode; className?: string };

function FieldShell({ id, label, error, hint, className, children }: FieldProps & { id: string; children: ReactNode }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={id} className="text-[13px] font-medium text-zinc-300">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <span id={`${id}-error`} className="text-xs text-red-400">
          {error}
        </span>
      ) : (
        hint && (
          <span id={`${id}-hint`} className="text-xs text-zinc-500">
            {hint}
          </span>
        )
      )}
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & FieldProps;

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, hint, className, id, ...props }, ref) => {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldShell id={fieldId} label={label} error={error} hint={hint} className={className}>
      <input
        ref={ref}
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        className={fieldClass}
        {...props}
      />
    </FieldShell>
  );
});

Input.displayName = "Input";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & FieldProps;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const autoId = useId();
    const fieldId = id ?? autoId;
    return (
      <FieldShell id={fieldId} label={label} error={error} hint={hint} className={className}>
        <textarea
          ref={ref}
          id={fieldId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
          className={cn(fieldClass, "min-h-[72px] resize-y leading-relaxed")}
          {...props}
        />
      </FieldShell>
    );
  }
);

Textarea.displayName = "Textarea";
