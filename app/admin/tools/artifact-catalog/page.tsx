import { redirect } from "next/navigation";
import { AdminShell } from "@/app/admin/AdminShell";
import { ArtifactCatalogApp } from "@/app/dev/artifact-catalog/ArtifactCatalogApp";
import { getAdminUser } from "@/lib/adminAccess.server";

export default async function AdminArtifactCatalogPage() {
  const user = await getAdminUser();
  if (!user) redirect("/");

  return (
    <AdminShell
      title="Artifact Viewer"
      description="Live preview of all artifact types."
    >
      <div className="h-full min-h-0">
        <ArtifactCatalogApp deferredLoad />
      </div>
    </AdminShell>
  );
}
