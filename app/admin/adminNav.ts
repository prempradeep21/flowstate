import type { AdminIconName } from "@/app/admin/icons/AdminIcons";

export type AdminNavGroupId = "home" | "build" | "lab" | "operate";

export interface AdminNavItem {
  href: string;
  label: string;
  description: string;
  icon: AdminIconName;
  exact?: boolean;
  group: AdminNavGroupId;
  quickAction?: boolean;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    href: "/admin",
    label: "Dashboard",
    description: "Internal workspace for Flowstate builders.",
    icon: "dashboard",
    exact: true,
    group: "home",
  },
  {
    href: "/admin/tools/artifact-catalog",
    label: "Artifact Viewer",
    description: "Live preview of every artifact type on the canvas.",
    icon: "artifact-viewer",
    group: "build",
    quickAction: true,
  },
  {
    href: "/admin/tools/artifact-intent",
    label: "Artifact Intent",
    description:
      "When and how each artifact type is spun up — intent rules and spawn behavior.",
    icon: "compass",
    group: "build",
  },
  {
    href: "/admin/tools/sound",
    label: "Sound Console",
    description: "Map seslen presets to UI events and preview specimens.",
    icon: "sound",
    group: "build",
  },
  {
    href: "/admin/tools/design-system",
    label: "Design System",
    description: "Live theme controls — presets, colors, radius, and reference.",
    icon: "design-system",
    group: "build",
  },
  {
    href: "/admin/ideas",
    label: "Groundbreaking ideas",
    description:
      "Exploratory concepts with optional playgrounds — admin-only prototypes.",
    icon: "ideas",
    group: "lab",
    quickAction: true,
  },
  {
    href: "/admin/analytics/usage",
    label: "Usage Analysis",
    description:
      "Token usage by account and canvas — nightly IST snapshot with charts.",
    icon: "usage",
    group: "operate",
    quickAction: true,
  },
  {
    href: "/admin/feedback",
    label: "Beta suggestions",
    description: "Read suggestions submitted from the canvas Suggestions button.",
    icon: "feedback",
    group: "operate",
    quickAction: true,
  },
  {
    href: "/admin/docs/chronology",
    label: "Shipping log",
    description: "Main-branch pushes grouped into working sessions.",
    icon: "shipping-log",
    group: "operate",
  },
  {
    href: "/admin/docs/philosophy",
    label: "Philosophy",
    description: "Governing principles and design language references.",
    icon: "philosophy",
    group: "operate",
  },
];

export const ADMIN_NAV_GROUP_LABELS: Record<AdminNavGroupId, string> = {
  home: "Home",
  build: "Build",
  lab: "Lab",
  operate: "Operate",
};

export const ADMIN_NAV_GROUP_ORDER: AdminNavGroupId[] = [
  "home",
  "build",
  "lab",
  "operate",
];

export const ADMIN_NAV_GROUPS = ADMIN_NAV_GROUP_ORDER.map((id) => ({
  id,
  label: ADMIN_NAV_GROUP_LABELS[id],
  items: ADMIN_NAV_ITEMS.filter((item) => item.group === id),
}));

export const ADMIN_QUICK_ACTIONS = ADMIN_NAV_ITEMS.filter(
  (item) => item.quickAction,
);

export const ADMIN_DASHBOARD_SECTIONS = ADMIN_NAV_GROUP_ORDER.filter(
  (id) => id !== "home",
).map((id) => ({
  id,
  label: ADMIN_NAV_GROUP_LABELS[id],
  items: ADMIN_NAV_ITEMS.filter((item) => item.group === id),
}));

export function getAdminNavItem(href: string): AdminNavItem | undefined {
  return ADMIN_NAV_ITEMS.find(
    (item) => item.href === href || href.startsWith(`${item.href}/`),
  );
}

export function isAdminNavActive(
  pathname: string,
  href: string,
  exact?: boolean,
): boolean {
  if (exact) return pathname === href;
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}
