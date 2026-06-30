"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [{ href: "/admin", label: "Dashboard", exact: true }],
  },
  {
    label: "Tools",
    items: [
      { href: "/admin/tools/artifact-catalog", label: "Artifact Viewer" },
      { href: "/admin/tools/sound", label: "Sound Console" },
      { href: "/admin/tools/design-system", label: "Design System" },
    ],
  },
  {
    label: "Docs",
    items: [
      { href: "/admin/docs/chronology", label: "Shipping log" },
      { href: "/admin/docs/philosophy", label: "Philosophy" },
    ],
  },
  {
    label: "Ideas",
    items: [{ href: "/admin/ideas", label: "Groundbreaking ideas" }],
  },
  {
    label: "Feedback",
    items: [{ href: "/admin/feedback", label: "Beta suggestions" }],
  },
  {
    label: "Analytics",
    items: [{ href: "/admin/analytics/usage", label: "Usage Analysis" }],
  },
] as const;

function isActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({
  children,
  title,
  description,
}: {
  children: ReactNode;
  title?: string;
  description?: string;
}) {
  const pathname = usePathname();
  const isFullBleedRoute =
    pathname.startsWith("/admin/tools/") || pathname.includes("/playground");

  return (
    <div className="flex h-full min-h-0 flex-col bg-canvas-bg text-canvas-ink">
      <header className="shrink-0 border-b border-canvas-border bg-canvas-card/95 px-4 py-3 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-canvas-micro font-semibold uppercase tracking-wider text-canvas-muted">
              Flowstate Admin
            </p>
            {title ? (
              <h1 className="truncate font-display text-xl font-medium">{title}</h1>
            ) : null}
            {description ? (
              <p className="mt-0.5 truncate text-canvas-body-sm text-canvas-muted">
                {description}
              </p>
            ) : null}
          </div>
          <Link
            href="/"
            className="shrink-0 rounded-canvas border border-canvas-border bg-canvas-card px-3 py-2 text-canvas-body-sm font-medium text-canvas-ink transition-colors hover:bg-canvas-bg"
          >
            Back to canvas
          </Link>
        </div>
      </header>

      <div className="mx-auto flex min-h-0 w-full max-w-[1600px] flex-1">
        <aside className="hidden w-56 shrink-0 border-r border-canvas-border bg-canvas-card/40 p-4 md:block">
          <nav className="space-y-5" aria-label="Admin navigation">
            {NAV_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="mb-2 px-2 text-canvas-micro font-semibold uppercase tracking-wider text-canvas-muted">
                  {group.label}
                </p>
                <ul className="space-y-1">
                  {group.items.map((item) => {
                    const active = isActive(
                      pathname,
                      item.href,
                      "exact" in item ? item.exact : false,
                    );
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          aria-current={active ? "page" : undefined}
                          className={`block rounded-canvas px-2 py-2 text-canvas-body-sm transition-colors ${
                            active
                              ? "bg-canvas-ink text-canvas-card"
                              : "text-canvas-muted hover:bg-canvas-bg hover:text-canvas-ink"
                          }`}
                        >
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        <main
          className={`min-h-0 flex-1 ${
            isFullBleedRoute ? "overflow-hidden" : "overflow-auto"
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
