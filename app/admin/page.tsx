import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminShell } from "@/app/admin/AdminShell";
import {
  ADMIN_DASHBOARD_SECTIONS,
  ADMIN_QUICK_ACTIONS,
} from "@/app/admin/adminNav";
import { AdminCardIcon } from "@/app/admin/icons/AdminIcons";
import { getAdminUser } from "@/lib/adminAccess.server";
import { getLabSummary } from "@/lib/admin/ideasManifest";

function DashboardCard({
  href,
  title,
  description,
  icon,
  badge,
}: {
  href: string;
  title: string;
  description: string;
  icon: Parameters<typeof AdminCardIcon>[0]["name"];
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="admin-dashboard-card group flex gap-3 rounded-canvas border border-canvas-border bg-canvas-card p-4 transition-colors hover:border-canvas-accent/35 hover:bg-canvas-bg"
    >
      <AdminCardIcon name={icon} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-lg font-medium text-canvas-ink group-hover:text-canvas-accent">
            {title}
          </h3>
          {badge ? (
            <span className="shrink-0 rounded-full border border-canvas-border bg-canvas-bg px-2 py-0.5 text-canvas-micro font-medium text-canvas-muted">
              {badge}
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-canvas-body-sm text-canvas-muted">{description}</p>
      </div>
    </Link>
  );
}

export default async function AdminDashboardPage() {
  const user = await getAdminUser();
  if (!user) redirect("/");

  const labSummary = getLabSummary();

  return (
    <AdminShell
      title="Dashboard"
      description="Internal tools, docs, and feedback for Flowstate builders."
    >
      <div className="space-y-8 p-4 sm:p-6">
        <section className="rounded-canvas border border-canvas-border bg-canvas-card/50 px-4 py-3">
          <p className="text-canvas-body-sm text-canvas-muted">
            Internal workspace for{" "}
            <strong className="font-medium text-canvas-ink">Flowstate builders</strong>
            . Jump to tools, lab ideas, or operational dashboards below.
          </p>
        </section>

        <section>
          <h2 className="text-canvas-body-sm font-semibold uppercase tracking-wider text-canvas-muted">
            Quick actions
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {ADMIN_QUICK_ACTIONS.map((item) => (
              <DashboardCard
                key={item.href}
                href={item.href}
                title={item.label}
                description={item.description}
                icon={item.icon}
                badge={
                  item.href === "/admin/ideas"
                    ? `${labSummary.ideaCount} idea${labSummary.ideaCount === 1 ? "" : "s"}`
                    : undefined
                }
              />
            ))}
          </div>
        </section>

        {ADMIN_DASHBOARD_SECTIONS.map((section) => (
          <section key={section.id}>
            <h2 className="text-canvas-body-sm font-semibold uppercase tracking-wider text-canvas-muted">
              {section.label}
            </h2>
            <div
              className={`mt-3 grid gap-3 ${
                section.id === "build"
                  ? "sm:grid-cols-2 xl:grid-cols-3"
                  : "sm:grid-cols-2"
              }`}
            >
              {section.items.map((item) => (
                <DashboardCard
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  description={item.description}
                  icon={item.icon}
                  badge={
                    item.href === "/admin/ideas"
                      ? `${labSummary.playgroundCount} playground${labSummary.playgroundCount === 1 ? "" : "s"}`
                      : undefined
                  }
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </AdminShell>
  );
}
