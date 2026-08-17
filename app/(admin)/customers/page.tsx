import Link from "next/link";
import { getCurrentStoreId } from "@/lib/current-store";
import { listCustomers } from "@/services/customers";

export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });

export default async function CustomersPage() {
  const storeId = await getCurrentStoreId();
  const customers = await listCustomers(storeId);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Clientes</h1>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="min-w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
          <thead className="bg-zinc-50 dark:bg-zinc-900">
            <tr>
              {["Nome", "Telefone", "Pedidos", "Desde", "Ações"].map((h) => (
                <th key={h} className="px-4 py-2 text-left font-medium text-zinc-500 dark:text-zinc-400">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
            {customers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-zinc-500">
                  Nenhum cliente ainda — assim que alguém mandar mensagem pro bot, aparece aqui.
                </td>
              </tr>
            )}
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td className="px-4 py-2 text-zinc-900 dark:text-zinc-50">{customer.name ?? "—"}</td>
                <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">{customer.whatsappPhone}</td>
                <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">{customer.ordersCount}</td>
                <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">
                  {dateFormatter.format(new Date(customer.createdAt))}
                </td>
                <td className="px-4 py-2">
                  {customer.conversationId && (
                    <Link
                      href={`/conversations/${customer.conversationId}`}
                      className="text-sm font-medium text-zinc-900 underline dark:text-zinc-50"
                    >
                      Ver conversa
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
