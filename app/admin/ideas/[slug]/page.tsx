import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AdminShell } from "@/app/admin/AdminShell";
import { AdminBreadcrumb } from "@/app/admin/components/AdminBreadcrumb";
import { IdeaViewer } from "@/app/admin/ideas/IdeaViewer";
import { AdminActionIcon } from "@/app/admin/icons/AdminIcons";
import { getAdminUser } from "@/lib/adminAccess.server";
import { getIdeaBySlug } from "@/lib/admin/ideasManifest";
import { readMarkdownFile } from "@/lib/specViewer/readSpec";

export default async function AdminIdeaDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await getAdminUser();
  if (!user) redirect("/");

  const { slug } = await params;
  const idea = getIdeaBySlug(slug);
  if (!idea) notFound();

  const markdown = readMarkdownFile(idea.markdownPath);

  return (
    <AdminShell title={idea.title} description={idea.tagline}>
      <div className="p-4 sm:p-6">
        <div className="mx-auto max-w-4xl">
          <AdminBreadcrumb
            items={[
              { label: "Lab", href: "/admin/ideas" },
              { label: idea.title },
            ]}
          />
          <div className="mb-6 flex flex-wrap items-center gap-3">
            {idea.playgroundPath ? (
              <Link
                href={idea.playgroundPath}
                className="inline-flex items-center gap-1.5 rounded-canvas border border-canvas-ink/20 bg-canvas-ink px-4 py-2 text-canvas-body-sm font-medium text-canvas-card transition-opacity hover:opacity-90"
              >
                <AdminActionIcon name="play" className="text-canvas-card" />
                Play in playground
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-canvas border border-canvas-border bg-canvas-bg px-4 py-2 text-canvas-body-sm font-medium text-canvas-muted opacity-60"
              >
                <AdminActionIcon name="play" />
                Play (no playground)
              </button>
            )}
            <Link
              href="/admin/ideas"
              className="inline-flex items-center gap-1.5 rounded-canvas border border-canvas-border bg-canvas-card px-4 py-2 text-canvas-body-sm font-medium text-canvas-ink transition-colors hover:bg-canvas-bg"
            >
              <AdminActionIcon name="ideas" />
              All ideas
            </Link>
          </div>
          <IdeaViewer markdown={markdown} />
        </div>
      </div>
    </AdminShell>
  );
}
