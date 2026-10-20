import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Junta classes do Tailwind resolvendo conflitos (ex: "h-12" + "h-10" → "h-10"). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
