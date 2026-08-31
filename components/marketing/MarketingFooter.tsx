import Link from "next/link";
import { BRAND_NAME, CONTACT_EMAIL } from "@/lib/marketing-config";

export function MarketingFooter() {
  return (
    <footer className="border-t border-zinc-200 bg-white py-8 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-black dark:text-zinc-400">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-4 text-center md:flex-row md:justify-between md:px-6 md:text-left">
        <span>
          © {new Date().getFullYear()} {BRAND_NAME} — atendimento automático via WhatsApp
        </span>
        <div className="flex gap-4">
          <Link href="/duvidas" className="hover:underline">
            Dúvidas
          </Link>
          <Link href="/login" className="hover:underline">
            Entrar
          </Link>
          <a href={`mailto:${CONTACT_EMAIL}`} className="hover:underline">
            {CONTACT_EMAIL}
          </a>
        </div>
      </div>
    </footer>
  );
}
