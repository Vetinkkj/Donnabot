import { getCurrentStoreId } from "@/lib/current-store";
import { getDashboardOverview, resolveDashboardRange } from "@/services/dashboard";
import { DashboardView } from "@/components/admin/dashboard/DashboardView";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; de?: string; ate?: string }>;
}) {
  const range = resolveDashboardRange(await searchParams);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());

  const storeId = await getCurrentStoreId();
  const data = await getDashboardOverview(storeId, range);

  return <DashboardView data={data} today={today} />;
}
