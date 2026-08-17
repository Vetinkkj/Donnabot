import type { ReactNode } from "react";
import { auth } from "@/auth";
import { Sidebar } from "@/components/admin/Sidebar";
import { LogoutButton } from "@/components/admin/LogoutButton";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar userLabel={session?.user?.name ?? session?.user?.email} footer={<LogoutButton />} />
      <main className="flex-1 overflow-x-auto bg-zinc-50 p-4 dark:bg-black md:p-8">{children}</main>
    </div>
  );
}
