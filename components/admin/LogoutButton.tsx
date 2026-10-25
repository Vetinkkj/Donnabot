import { LogOut } from "lucide-react";
import { signOut } from "@/auth";

export function LogoutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/login" });
      }}
    >
      <button
        type="submit"
        title="Sair"
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-emerald-500 group-data-[collapsed=true]/sidebar:justify-center group-data-[collapsed=true]/sidebar:px-0"
      >
        <LogOut className="size-[18px] shrink-0" aria-hidden />
        {/* Some quando a barra lateral está recolhida (ver Sidebar). */}
        <span className="group-data-[collapsed=true]/sidebar:sr-only">Sair</span>
      </button>
    </form>
  );
}
