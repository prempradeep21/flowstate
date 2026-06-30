import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AdminShell } from "@/app/admin/AdminShell";
import { IdeaViewer } from "@/app/admin/ideas/IdeaViewer";
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
        <div className="mx-auto mb-6 flex max-w-4xl flex-wrap items-center gap-3">
          {idea.playgroundPath ? (
            <Link
              href={idea.playgroundPath}
              className="inline-flex items-center gap-1.5 rounded-canvas border border-canvas-ink/20 bg-canvas-ink px-4 py-2 text-canvas-body-sm font-medium text-canvas-card transition-opacity hover:opacity-90"
            >
              <svg aria-hidden viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor">
                <path d="M4 2.5v11l9-5.5-9-5.5z" />
              </svg>
              Play in playground
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-canvas border border-canvas-border bg-canvas-bg px-4 py-2 text-canvas-body-sm font-medium text-canvas-muted opacity-60"
            >
              Play (no playground)
            </button>
          )}
          <Link
            href="/admin/ideas"
            className="rounded-canvas border border-canvas-border bg-canvas-card px-4 py-2 text-canvas-body-sm font-medium text-canvas-ink transition-colors hover:bg-canvas-bg"
          >
            All ideas
          </Link>
        </div>
        <IdeaViewer markdown={markdown} />
      </div>
    </AdminShell>
  );
}
