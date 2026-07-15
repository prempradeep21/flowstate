import { redirect } from "next/navigation";
import { AdminShell } from "@/app/admin/AdminShell";
import { SampleCanvasesClient } from "@/app/admin/sample-canvases/SampleCanvasesClient";
import { getAdminUser } from "@/lib/adminAccess.server";

export default async function AdminSampleCanvasesPage() {
  const user = await getAdminUser();
  if (!user) redirect("/");

  return (
    <AdminShell
      title="Sample Canvases"
      description="Code-defined research canvases built with the research-canvas skill. Add a copy to your account to explore or showcase it."
    >
      <SampleCanvasesClient />
    </AdminShell>
  );
}
