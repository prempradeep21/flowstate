import Link from "next/link";
import { AdminIcon } from "@/app/admin/icons/AdminIcons";

export type AdminBreadcrumbItem = {
  label: string;
  href?: string;
};

export function AdminBreadcrumb({ items }: { items: AdminBreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="admin-breadcrumb mb-4">
      <ol className="flex flex-wrap items-center gap-1.5 text-canvas-body-sm text-canvas-muted">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {index > 0 ? (
                <AdminIcon
                  name="chevron-right"
                  className="h-3.5 w-3.5 text-canvas-muted/70"
                />
              ) : null}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="font-medium transition-colors hover:text-canvas-ink"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={
                    isLast ? "truncate font-medium text-canvas-ink" : "font-medium"
                  }
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
