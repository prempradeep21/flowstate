import { notFound, redirect } from "next/navigation";
import { AdminShell } from "@/app/admin/AdminShell";
import { getAdminUser } from "@/lib/adminAccess.server";
import { getIdeaBySlug } from "@/lib/admin/ideasManifest";
import { StickmanPlaygroundApp } from "./StickmanPlaygroundApp";

export default async function StickmanPlaygroundPage() {
  const user = await getAdminUser();
  if (!user) redirect("/");

  const idea = getIdeaBySlug("canvas-pet-stickman");
  if (!idea?.playgroundPath) notFound();

  return (
    <AdminShell
      title="Playground"
      description={`${idea.title} — observe the pet in isolation`}
      immersive
      immersiveBackHref={`/admin/ideas/${idea.slug}`}
      immersiveBackLabel="Back to idea"
    >
      <div className="h-full min-h-0">
        <StickmanPlaygroundApp />
      </div>
    </AdminShell>
  );
}
