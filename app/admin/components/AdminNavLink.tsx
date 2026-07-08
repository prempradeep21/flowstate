import Link from "next/link";
import { AdminNavIcon } from "@/app/admin/icons/AdminIcons";
import type { AdminNavItem } from "@/app/admin/adminNav";

export function AdminNavLink({
  item,
  active,
  onClick,
  compact,
}: {
  item: AdminNavItem;
  active: boolean;
  onClick?: () => void;
  compact?: boolean;
}) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`admin-nav-link group flex items-center gap-2.5 rounded-canvas py-2 text-canvas-body-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-canvas-accent/40 ${
        compact ? "px-3 shrink-0" : "px-2.5"
      } ${
        active
          ? "admin-nav-link-active bg-canvas-card text-canvas-ink"
          : "text-canvas-muted hover:bg-canvas-card/60 hover:text-canvas-ink"
      }`}
    >
      <AdminNavIcon name={item.icon} active={active} />
      <span className="truncate font-medium">{item.label}</span>
    </Link>
  );
}
