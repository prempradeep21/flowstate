import type { ReactNode } from "react";

const STROKE = 1.75;

function Svg({
  children,
  className,
  viewBox = "0 0 20 20",
}: {
  children: ReactNode;
  className?: string;
  viewBox?: string;
}) {
  return (
    <svg
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth={STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {children}
    </svg>
  );
}

export type AdminIconName =
  | "dashboard"
  | "artifact-viewer"
  | "sound"
  | "design-system"
  | "ideas"
  | "shipping-log"
  | "philosophy"
  | "feedback"
  | "usage"
  | "play"
  | "status-exploring"
  | "status-prototype"
  | "status-shipped"
  | "back"
  | "refresh"
  | "export"
  | "search"
  | "fit-canvas"
  | "inbox"
  | "message"
  | "link"
  | "image"
  | "chevron-down"
  | "chevron-up"
  | "chevron-right"
  | "book"
  | "compass"
  | "sparkles"
  | "layers"
  | "transcript";

const ICONS: Record<AdminIconName, ReactNode> = {
  dashboard: (
  <>
    <rect x="2.5" y="2.5" width="6" height="6" rx="1" />
    <rect x="11.5" y="2.5" width="6" height="6" rx="1" />
    <rect x="2.5" y="11.5" width="6" height="6" rx="1" />
    <rect x="11.5" y="11.5" width="6" height="6" rx="1" />
  </>
  ),
  "artifact-viewer": (
  <>
    <path d="M10 3 3 7l7 4 7-4-7-4Z" />
    <path d="M3 12l7 4 7-4" />
    <path d="M3 7v5" />
    <path d="M17 7v5" />
  </>
  ),
  sound: (
  <>
    <path d="M3 8v4" />
    <path d="M6 6v8" />
    <path d="M9 4v12" />
    <path d="M12 7v6" />
    <path d="M15 9v2" />
  </>
  ),
  "design-system": (
  <>
    <circle cx="7" cy="7" r="2.5" />
    <circle cx="13" cy="7" r="2.5" />
    <circle cx="10" cy="13" r="2.5" />
  </>
  ),
  ideas: (
  <>
    <path d="M10 2.5a4.5 4.5 0 0 0-2.5 8.2V13h5v-2.3A4.5 4.5 0 0 0 10 2.5Z" />
    <path d="M8.5 15.5h3" />
    <path d="M9 17.5h2" />
  </>
  ),
  "shipping-log": (
  <>
    <path d="M3 4h14" />
    <path d="M5 4v12" />
    <circle cx="10" cy="10" r="2.5" />
    <path d="M15 4v12" />
  </>
  ),
  philosophy: (
  <>
    <path d="M4 4h8a3 3 0 0 1 0 6H6" />
    <path d="M6 10v6" />
    <path d="M4 16h4" />
  </>
  ),
  feedback: (
  <>
    <path d="M3 4h14v9H6l-3 3V4Z" />
    <path d="M7 8h6" />
    <path d="M7 11h4" />
  </>
  ),
  usage: (
  <>
    <path d="M4 16V9" />
    <path d="M8 16V5" />
    <path d="M12 16v-4" />
    <path d="M16 16V7" />
  </>
  ),
  play: (
    <path d="M7 5v10l8-5-8-5Z" fill="currentColor" stroke="none" />
  ),
  "status-exploring": (
  <>
    <circle cx="10" cy="10" r="6.5" />
    <path d="M10 6.5V10l2.5 1.5" />
  </>
  ),
  "status-prototype": (
  <>
    <path d="M7 4h6l2 4v8H5V8l2-4Z" />
    <path d="M8 11h4" />
    <path d="M9 8h2" />
  </>
  ),
  "status-shipped": (
  <>
    <circle cx="10" cy="10" r="6.5" />
    <path d="m7 10 2 2 4-4" />
  </>
  ),
  back: (
  <>
    <path d="M12.5 4 7.5 10l5 6" />
  </>
  ),
  refresh: (
  <>
    <path d="M16 10a6 6 0 1 0-1.5 4" />
    <path d="M16 4v6h-6" />
  </>
  ),
  export: (
  <>
    <path d="M10 3v9" />
    <path d="M6.5 8.5 10 12l3.5-3.5" />
    <path d="M4 16h12" />
  </>
  ),
  search: (
  <>
    <circle cx="9" cy="9" r="4.5" />
    <path d="M13 13l3.5 3.5" />
  </>
  ),
  "fit-canvas": (
  <>
    <path d="M3 7V3h4" />
    <path d="M17 7V3h-4" />
    <path d="M3 13v4h4" />
    <path d="M17 13v4h-4" />
  </>
  ),
  inbox: (
  <>
    <path d="M3 5h14v10H3V5Z" />
    <path d="M3 9h4l1.5 2h3L13 9h4" />
  </>
  ),
  message: (
  <>
    <path d="M4 4h12v8H8l-4 3V4Z" />
  </>
  ),
  link: (
  <>
    <path d="M8.5 11.5 6 14a2.5 2.5 0 0 1-3.5-3.5l2.5-2.5" />
    <path d="M11.5 8.5 14 6a2.5 2.5 0 0 1 3.5 3.5l-2.5 2.5" />
    <path d="M7 13l6-6" />
  </>
  ),
  image: (
  <>
    <rect x="3" y="4" width="14" height="12" rx="1.5" />
    <circle cx="7.5" cy="8.5" r="1.5" />
    <path d="M17 14l-4-4-6 6" />
  </>
  ),
  "chevron-down": <path d="M5 8l5 5 5-5" />,
  "chevron-up": <path d="M5 12l5-5 5 5" />,
  "chevron-right": <path d="M8 5l5 5-5 5" />,
  book: (
  <>
    <path d="M4 4h5a2 2 0 0 1 2 2v12a2 2 0 0 0-2-2H4V4Z" />
    <path d="M16 4h-5a2 2 0 0 0-2 2v12a2 2 0 0 1 2-2h5V4Z" />
  </>
  ),
  compass: (
  <>
    <circle cx="10" cy="10" r="6.5" />
    <path d="m12.5 7.5-1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3Z" />
  </>
  ),
  sparkles: (
  <>
    <path d="M10 2.5v2" />
    <path d="M10 15.5v2" />
    <path d="M4.5 5.5 6 7" />
    <path d="M14 13l1.5 1.5" />
    <path d="M2.5 10h2" />
    <path d="M15.5 10h2" />
    <path d="M4.5 14.5 6 13" />
    <path d="M14 7l1.5-1.5" />
  </>
  ),
  layers: (
  <>
    <path d="M10 3 3 7l7 4 7-4-7-4Z" />
    <path d="M3 12l7 4 7-4" />
  </>
  ),
  transcript: (
  <>
    <path d="M5 5h10" />
    <path d="M5 10h10" />
    <path d="M5 15h6" />
  </>
  ),
};

export function AdminIcon({
  name,
  className = "h-5 w-5",
}: {
  name: AdminIconName;
  className?: string;
}) {
  const content = ICONS[name];
  if (name === "play") {
    return (
      <svg viewBox="0 0 20 20" className={className} aria-hidden>
        {content}
      </svg>
    );
  }
  return <Svg className={className}>{content}</Svg>;
}

export function AdminNavIcon({
  name,
  active,
}: {
  name: AdminIconName;
  active?: boolean;
}) {
  return (
    <span
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors ${
        active
          ? "bg-canvas-artifactIconBg text-canvas-accent"
          : "text-canvas-muted"
      }`}
    >
      <AdminIcon name={name} className="h-4 w-4" />
    </span>
  );
}

export function AdminCardIcon({ name }: { name: AdminIconName }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-canvas bg-canvas-artifactIconBg text-canvas-accent">
      <AdminIcon name={name} className="h-[18px] w-[18px]" />
    </span>
  );
}

export function AdminActionIcon({
  name,
  className = "h-4 w-4",
}: {
  name: AdminIconName;
  className?: string;
}) {
  return <AdminIcon name={name} className={className} />;
}

export function AdminStatusIcon({
  status,
}: {
  status: "Exploring" | "Prototype" | "Shipped";
}) {
  const map = {
    Exploring: "status-exploring",
    Prototype: "status-prototype",
    Shipped: "status-shipped",
  } as const;
  return <AdminIcon name={map[status]} className="h-3.5 w-3.5" />;
}

export function statusPillClass(status: "Exploring" | "Prototype" | "Shipped") {
  switch (status) {
    case "Exploring":
      return "idea-status-exploring";
    case "Prototype":
      return "idea-status-prototype";
    case "Shipped":
      return "idea-status-shipped";
  }
}
