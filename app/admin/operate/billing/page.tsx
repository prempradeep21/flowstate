import { redirect } from "next/navigation";
import { AdminShell } from "@/app/admin/AdminShell";
import { SpendDashboard } from "@/app/admin/operate/billing/SpendDashboard";
import { getAdminUser } from "@/lib/adminAccess.server";
import { loadSpendAnalysis } from "@/lib/admin/spendAnalysis.server";

export const dynamic = "force-dynamic";

export default async function SpendPage() {
  const user = await getAdminUser();
  if (!user) redirect("/");

  const data = await loadSpendAnalysis(30);

  return (
    <AdminShell
      title="Spend"
      description="Live per-request cost from usage_ledger. Unlike Usage Analysis, this sees signed-out and unsaved sessions, and includes prompt-cache tokens."
    >
      <SpendDashboard data={data} />
    </AdminShell>
  );
}
