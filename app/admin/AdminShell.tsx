"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  ADMIN_NAV_GROUPS,
  isAdminNavActive,
} from "@/app/admin/adminNav";
import { AdminNavLink } from "@/app/admin/components/AdminNavLink";
import { AdminMobileNav } from "@/app/admin/components/AdminMobileNav";
import { AdminActionIcon } from "@/app/admin/icons/AdminIcons";

/** Embedded tools that manage their own scroll region inside main. */
const FULL_BLEED_TOOL_PREFIXES = [
  "/admin/tools/artifact-catalog",
  "/admin/tools/design-system",
  "/admin/tools/sound",
] as const;

function isFullBleedRoute(pathname: string): boolean {
  if (pathname.includes("/playground")) return true;
  return FULL_BLEED_TOOL_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isPlaygroundRoute(pathname: string): boolean {
  return pathname.includes("/playground");
}

export function AdminShell({
  children,
  title,
  description,
  immersive,
  immersiveBackHref,
  immersiveBackLabel = "Back",
}: {
  children: ReactNode;
  title?: string;
  description?: string;
  immersive?: boolean;
  immersiveBackHref?: string;
  immersiveBackLabel?: string;
}) {
  const pathname = usePathname();
  const fullBleed = isFullBleedRoute(pathname);
  const playground = isPlaygroundRoute(pathname) || immersive;

  return (
    <div className="flex h-full min-h-0 flex-col bg-canvas-bg text-canvas-ink">
      <header className="shrink-0 border-b border-canvas-border bg-canvas-bg/95 px-4 py-3 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4">
          <div className="min-w-0">
            {playground && immersiveBackHref ? (
              <div className="flex items-center gap-3">
                <Link
                  href={immersiveBackHref}
                  className="inline-flex items-center gap-1.5 rounded-canvas border border-canvas-border bg-canvas-card px-2.5 py-1.5 text-canvas-body-sm font-medium text-canvas-ink transition-colors hover:bg-canvas-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-canvas-accent/40"
                >
                  <AdminActionIcon name="back" className="h-4 w-4" />
                  {immersiveBackLabel}
                </Link>
                {title ? (
                  <h1 className="truncate font-display text-lg font-medium">
                    {title}
                  </h1>
                ) : null}
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-canvas-artifactIconBg text-canvas-accent">
                    <svg
                      viewBox="0 0 16 16"
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      aria-hidden
                    >
                      <circle cx="8" cy="8" r="2.5" />
                      <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2" />
                    </svg>
                  </span>
                  <p className="text-canvas-micro font-semibold uppercase tracking-wider text-canvas-muted">
                    Flowstate Admin
                  </p>
                </div>
                {title ? (
                  <h1 className="mt-1 truncate font-display text-xl font-medium">
                    {title}
                  </h1>
                ) : null}
                {description && !playground ? (
                  <p className="mt-0.5 truncate text-canvas-body-sm text-canvas-muted">
                    {description}
                  </p>
                ) : null}
              </>
            )}
          </div>
          <Link
            href="/"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-canvas border border-canvas-border bg-canvas-card px-3 py-2 text-canvas-body-sm font-medium text-canvas-ink transition-colors hover:bg-canvas-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-canvas-accent/40"
          >
            <AdminActionIcon name="back" className="h-4 w-4" />
            <span className="hidden sm:inline">Back to canvas</span>
            <span className="sm:hidden">Canvas</span>
          </Link>
        </div>
      </header>

      <AdminMobileNav />

      <div className="mx-auto flex min-h-0 w-full max-w-[1600px] flex-1">
        <aside className="hidden w-60 shrink-0 border-r border-canvas-border bg-canvas-bg p-4 md:block">
          <nav className="space-y-6" aria-label="Admin navigation">
            {ADMIN_NAV_GROUPS.map((group) => (
              <div key={group.id}>
                <p className="mb-2 px-2.5 text-canvas-micro font-semibold uppercase tracking-wider text-canvas-muted/80">
                  {group.label}
                </p>
                <ul className="space-y-0.5">
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <AdminNavLink
                        item={item}
                        active={isAdminNavActive(
                          pathname,
                          item.href,
                          item.exact,
                        )}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        <main
          className={`min-h-0 flex-1 ${
            fullBleed ? "overflow-hidden" : "overflow-auto"
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
