import { notFound, redirect } from "next/navigation";
import { AdminShell } from "@/app/admin/AdminShell";
import { TranscriptImportPlaygroundApp } from "@/app/admin/ideas/playground/TranscriptImportPlaygroundApp";
import { getAdminUser } from "@/lib/adminAccess.server";
import { getIdeaBySlug } from "@/lib/admin/ideasManifest";

export default async function TranscriptImportPlaygroundPage() {
  const user = await getAdminUser();
  if (!user) redirect("/");

  const idea = getIdeaBySlug("conversation-to-flowstate-transfer");
  if (!idea?.playgroundPath) notFound();

  return (
    <AdminShell
      title="Playground"
      description={`${idea.title} — transcript-only demo`}
      immersive
      immersiveBackHref={`/admin/ideas/${idea.slug}`}
      immersiveBackLabel="Back to idea"
    >
      <div className="h-full min-h-0">
        <TranscriptImportPlaygroundApp
          ideaTitle={idea.title}
          backHref={`/admin/ideas/${idea.slug}`}
          immersive
        />
      </div>
    </AdminShell>
  );
}
