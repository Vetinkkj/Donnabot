import { getCurrentStoreId } from "@/lib/current-store";
import { tierHas } from "@/lib/plans";
import { getDashboardOverview, resolveDashboardRange } from "@/services/dashboard";
import { getPlanUsage } from "@/services/plan-usage";
import { DashboardView } from "@/components/admin/dashboard/DashboardView";
import { ConversationUsage } from "@/components/admin/PlanNotices";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; de?: string; ate?: string }>;
}) {
  const range = resolveDashboardRange(await searchParams);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());

  const storeId = await getCurrentStoreId();
  const [data, plan] = await Promise.all([getDashboardOverview(storeId, range), getPlanUsage(storeId)]);

  return (
    <DashboardView
      data={data}
      today={today}
      analytics={tierHas(plan.tier, "analytics")}
      // Lojas do plano antigo (completo, sem limite) não veem medidor.
      usage={plan.legacy ? undefined : <ConversationUsage name={plan.name} used={plan.used} limit={plan.limit} />}
    />
  );
}
