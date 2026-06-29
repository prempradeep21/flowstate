import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminShell } from "@/app/admin/AdminShell";
import { getAdminUser } from "@/lib/adminAccess.server";

const TOOL_CARDS = [
  {
    href: "/admin/tools/artifact-catalog",
    title: "Artifact Viewer",
    description: "Live preview of every artifact type on the canvas.",
  },
  {
    href: "/admin/tools/sound",
    title: "Sound Console",
    description: "Map seslen presets to UI events and preview specimens.",
  },
  {
    href: "/admin/tools/design-system",
    title: "Design System",
    description: "Tokens, cards, connectors, and design documentation.",
  },
] as const;

const DOC_CARDS = [
  {
    href: "/admin/docs/chronology",
    title: "Shipping log",
    description: "Main-branch pushes grouped into working sessions.",
  },
  {
    href: "/admin/docs/philosophy",
    title: "Philosophy",
    description: "Governing principles and design language references.",
  },
] as const;

export default async function AdminDashboardPage() {
  const user = await getAdminUser();
  if (!user) redirect("/");

  return (
    <AdminShell
      title="Dashboard"
      description="Internal tools, docs, and feedback for Flowstate builders."
    >
      <div className="space-y-8 p-4 sm:p-6">
        <section>
          <h2 className="text-canvas-body-sm font-semibold uppercase tracking-wider text-canvas-muted">
            Tools
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {TOOL_CARDS.map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="rounded-canvas border border-canvas-border bg-canvas-card p-4 shadow-card transition-colors hover:border-canvas-accent/40 hover:bg-canvas-bg"
              >
                <h3 className="font-display text-lg font-medium text-canvas-ink">
                  {card.title}
                </h3>
                <p className="mt-1 text-canvas-body-sm text-canvas-muted">
                  {card.description}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-canvas-body-sm font-semibold uppercase tracking-wider text-canvas-muted">
            Docs
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {DOC_CARDS.map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="rounded-canvas border border-canvas-border bg-canvas-card p-4 shadow-card transition-colors hover:border-canvas-accent/40 hover:bg-canvas-bg"
              >
                <h3 className="font-display text-lg font-medium text-canvas-ink">
                  {card.title}
                </h3>
                <p className="mt-1 text-canvas-body-sm text-canvas-muted">
                  {card.description}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-canvas-body-sm font-semibold uppercase tracking-wider text-canvas-muted">
            Analytics
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Link
              href="/admin/analytics/usage"
              className="rounded-canvas border border-canvas-border bg-canvas-card p-4 shadow-card transition-colors hover:border-canvas-accent/40 hover:bg-canvas-bg"
            >
              <h3 className="font-display text-lg font-medium text-canvas-ink">
                Usage Analysis
              </h3>
              <p className="mt-1 text-canvas-body-sm text-canvas-muted">
                Token usage by account and canvas — nightly IST snapshot with charts.
              </p>
            </Link>
          </div>
        </section>

        <section>
          <h2 className="text-canvas-body-sm font-semibold uppercase tracking-wider text-canvas-muted">
            Feedback
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Link
              href="/admin/feedback"
              className="rounded-canvas border border-canvas-border bg-canvas-card p-4 shadow-card transition-colors hover:border-canvas-accent/40 hover:bg-canvas-bg"
            >
              <h3 className="font-display text-lg font-medium text-canvas-ink">
                Beta suggestions
              </h3>
              <p className="mt-1 text-canvas-body-sm text-canvas-muted">
                Read suggestions submitted from the canvas Suggestions button.
              </p>
            </Link>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
