import { redirect } from "next/navigation";
import { AdminShell } from "@/app/admin/AdminShell";
import { UsageAnalysisDashboard } from "@/app/admin/analytics/UsageAnalysisDashboard";
import { getAdminUser } from "@/lib/adminAccess.server";

export default async function UsageAnalysisPage() {
  const user = await getAdminUser();
  if (!user) redirect("/");

  return (
    <AdminShell
      title="Usage Analysis"
      description="Token usage from saved canvases — snapshot refreshes nightly at 12:00 AM IST."
    >
      <UsageAnalysisDashboard />
    </AdminShell>
  );
}
