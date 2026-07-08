"use client";

import { usePathname } from "next/navigation";
import {
  ADMIN_NAV_GROUPS,
  isAdminNavActive,
} from "@/app/admin/adminNav";
import { AdminNavLink } from "@/app/admin/components/AdminNavLink";

export function AdminMobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="admin-mobile-nav flex gap-1 overflow-x-auto border-b border-canvas-border bg-canvas-bg px-3 py-2 md:hidden"
      aria-label="Admin navigation"
    >
      {ADMIN_NAV_GROUPS.flatMap((group) => group.items).map((item) => (
        <AdminNavLink
          key={item.href}
          item={item}
          active={isAdminNavActive(pathname, item.href, item.exact)}
          compact
        />
      ))}
    </nav>
  );
}
