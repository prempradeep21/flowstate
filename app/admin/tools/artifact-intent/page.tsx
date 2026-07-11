import { redirect } from "next/navigation";
import { AdminShell } from "@/app/admin/AdminShell";
import { ArtifactIntentApp } from "@/app/admin/tools/artifact-intent/ArtifactIntentApp";
import { getAdminUser } from "@/lib/adminAccess.server";

export default async function AdminArtifactIntentPage() {
  const user = await getAdminUser();
  if (!user) redirect("/");

  return (
    <AdminShell
      title="Artifact Intent"
      description="Rules that decide when each artifact type is created on the canvas."
    >
      <ArtifactIntentApp />
    </AdminShell>
  );
}
