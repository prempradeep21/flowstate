import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminShell } from "@/app/admin/AdminShell";
import { IdeaCard } from "@/app/admin/ideas/IdeaCard";
import { AdminCardIcon } from "@/app/admin/icons/AdminIcons";
import { getAdminUser } from "@/lib/adminAccess.server";
import { GROUNDBREAKING_IDEAS } from "@/lib/admin/ideasManifest";

export default async function AdminIdeasIndexPage() {
  const user = await getAdminUser();
  if (!user) redirect("/");

  return (
    <AdminShell
      title="Groundbreaking ideas"
      description="Exploratory product concepts — temporary playgrounds, not shipped features."
    >
      <div className="space-y-6 p-4 sm:p-6">
        <section className="flex gap-3 rounded-canvas border border-canvas-border bg-canvas-card/50 p-4">
          <AdminCardIcon name="ideas" />
          <p className="text-canvas-body-sm text-canvas-muted">
            Each idea can include a read-only doc and an optional{" "}
            <strong className="font-medium text-canvas-ink">Play</strong> sandbox.
            Conversation cards and import flows here are admin-only prototypes —
            not part of the design system or artifact catalog.
          </p>
        </section>
        <div className="grid gap-4 lg:grid-cols-2">
          {GROUNDBREAKING_IDEAS.map((idea) => (
            <IdeaCard key={idea.slug} idea={idea} />
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
