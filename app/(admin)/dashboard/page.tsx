import { getCurrentStoreId } from "@/lib/current-store";
import { getDashboardStats } from "@/services/orders";
import { StatCard } from "@/components/admin/StatCard";

export const dynamic = "force-dynamic";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default async function DashboardPage() {
  const storeId = await getCurrentStoreId();
  const stats = await getDashboardStats(storeId);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard icon="📦" label="Produtos cadastrados" value={String(stats.productsCount)} />
        <StatCard icon="💰" label="Vendas do dia" value={String(stats.salesToday)} />
        <StatCard icon="💰" label="Faturamento do dia" value={currency.format(stats.revenueToday)} />
        <StatCard icon="🛒" label="Pedidos pendentes" value={String(stats.pendingOrders)} />
        <StatCard icon="✅" label="Pedidos pagos" value={String(stats.paidOrders)} />
        <StatCard icon="⚠️" label="Produtos com estoque baixo" value={String(stats.lowStockCount)} />
      </div>
    </div>
  );
}
