import type { ReactNode } from "react";

/** Esqueleto do dashboard: mesma grade da página, para nada "pular" quando os dados chegam. */
function Bone({ className = "" }: { className?: string }) {
  return <div className={`rounded-md bg-white/[0.06] motion-safe:animate-pulse ${className}`} />;
}

function PanelBone({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`rounded-2xl border border-white/[0.07] bg-zinc-900/50 p-5 sm:p-6 ${className}`}>{children}</div>;
}

export default function DashboardLoading() {
  return (
    <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-5" aria-busy="true" aria-label="Carregando o dashboard">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-2">
          <Bone className="h-7 w-40" />
          <Bone className="h-4 w-64" />
        </div>
        <Bone className="h-10 w-full max-w-[520px] rounded-xl" />
      </div>
      <PanelBone className="p-4 sm:p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Bone className="size-10 rounded-xl" />
              <div className="flex flex-col gap-2">
                <Bone className="h-5 w-32" />
                <Bone className="h-3 w-40" />
              </div>
            </div>
          ))}
        </div>
      </PanelBone>
      <PanelBone>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-3">
            <Bone className="h-4 w-24" />
            <Bone className="h-11 w-56" />
            <Bone className="h-4 w-40" />
          </div>
          <div className="flex flex-col gap-3">
            <Bone className="h-4 w-24" />
            <Bone className="h-7 w-20" />
          </div>
          <div className="flex flex-col gap-3">
            <Bone className="h-4 w-24" />
            <Bone className="h-7 w-28" />
          </div>
        </div>
        <Bone className="mt-8 h-[240px] w-full rounded-xl" />
      </PanelBone>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <PanelBone className="lg:col-span-7">
          <Bone className="h-5 w-32" />
          <Bone className="mt-6 h-40 w-full rounded-xl" />
        </PanelBone>
        <PanelBone className="lg:col-span-5">
          <Bone className="h-5 w-32" />
          <Bone className="mt-6 h-40 w-full rounded-xl" />
        </PanelBone>
      </div>
    </div>
  );
}
