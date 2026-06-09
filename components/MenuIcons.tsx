"use client";

import type { ReactNode } from "react";

export function LayoutGridIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="h-4 w-4 shrink-0" fill="none">
      <rect
        x="2.5"
        y="2.5"
        width="4.5"
        height="4.5"
        rx="0.75"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <rect
        x="9"
        y="2.5"
        width="4.5"
        height="4.5"
        rx="0.75"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <rect
        x="2.5"
        y="9"
        width="4.5"
        height="4.5"
        rx="0.75"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <rect
        x="9"
        y="9"
        width="4.5"
        height="4.5"
        rx="0.75"
        stroke="currentColor"
        strokeWidth="1.25"
      />
    </svg>
  );
}

export function UndoIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="h-4 w-4 shrink-0" fill="none">
      <path
        d="M3.5 7.5H10a3.5 3.5 0 1 1 0 7H8.5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 4.5 3.5 7.5 6 10.5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BranchForkIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="h-4 w-4 shrink-0" fill="none">
      <path
        d="M8 3v4M8 7c-2.2 0-3.5 1.2-3.5 3.5V13"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      <path
        d="M8 7c2.2 0 3.5 1.2 3.5 3.5V13"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      <circle cx="8" cy="3" r="1.25" fill="currentColor" />
    </svg>
  );
}

export function QuestionIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="h-4 w-4 shrink-0" fill="none">
      <path
        d="M4 4.5h8v5H6.5L4 12V9.5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChatBubbleIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="h-4 w-4 shrink-0" fill="none">
      <path
        d="M3.5 4.5h9a1.5 1.5 0 0 1 1.5 1.5v4a1.5 1.5 0 0 1-1.5 1.5H7l-2.5 2v-2H3.5A1.5 1.5 0 0 1 2 10V6a1.5 1.5 0 0 1 1.5-1.5Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TypeIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="h-4 w-4 shrink-0" fill="none">
      <path
        d="M4 4.5h8M4 8h5.5M4 11.5h7"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PlusIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="h-4 w-4 shrink-0" fill="none">
      <path
        d="M8 3.5v9M3.5 8h9"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ImageIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="h-4 w-4 shrink-0" fill="none">
      <rect
        x="2.5"
        y="3.5"
        width="11"
        height="9"
        rx="1.25"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <circle cx="5.75" cy="6.75" r="1.1" fill="currentColor" />
      <path
        d="M3.5 11.5 6.5 8.5l2 1.75L10.5 8l2 3.5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function GifIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="h-4 w-4 shrink-0" fill="none">
      <rect
        x="2"
        y="4"
        width="12"
        height="8"
        rx="1.25"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <path
        d="M4.5 7.25h1.1v1.5M6.2 7.25v1.5M6.2 7.25h.85a.55.55 0 0 1 0 1.1H6.2M8.4 8.75V7.25M8.4 7.25h.9a.55.55 0 0 1 0 1.1H8.4M10.5 8.75c0-.55-.45-1-1-1s-1 .45-1 1 .45 1 1 1 1-.45 1-1Z"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ShareIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="h-4 w-4 shrink-0" fill="none">
      <circle cx="12" cy="4" r="1.75" stroke="currentColor" strokeWidth="1.1" />
      <circle cx="4" cy="8" r="1.75" stroke="currentColor" strokeWidth="1.1" />
      <circle cx="12" cy="12" r="1.75" stroke="currentColor" strokeWidth="1.1" />
      <path
        d="M5.6 7.1 10.4 4.9M5.6 8.9l4.8 2.2"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SoundOnIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="h-4 w-4 shrink-0" fill="none">
      <path
        d="M3.5 5.5v5l3-2v-1l-3-2Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 5.5c1.2.8 2 2.1 2 3.5s-.8 2.7-2 3.5M11.25 4c1.9 1.2 3.15 3.2 3.15 5.5S13.15 13.8 11.25 15"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SoundMuteIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="h-4 w-4 shrink-0" fill="none">
      <path
        d="M3.5 5.5v5l3-2v-1l-3-2Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      <path
        d="m10.5 6 3 3M13.5 6l-3 3"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SettingsIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="h-4 w-4 shrink-0" fill="none">
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.25" />
      <path
        d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M3.05 12.95l1.06-1.06M11.89 4.11l1.06-1.06"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function TrashIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="h-4 w-4 shrink-0" fill="none">
      <path
        d="M3.5 5h9M6 5V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      <path
        d="M4.5 5l.6 7.2a1 1 0 0 0 1 .8h3.8a1 1 0 0 0 1-.8L11.5 5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const menuItemClass =
  "flex w-full items-center gap-2.5 px-3 py-2 text-left text-canvas-body-sm text-canvas-ink transition-colors hover:bg-canvas-bg disabled:cursor-not-allowed disabled:opacity-40";

interface ContextMenuItemProps {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "danger";
}

export function ContextMenuItem({
  icon,
  label,
  onClick,
  disabled,
  variant = "default",
}: ContextMenuItemProps) {
  const danger = variant === "danger";

  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={[
        menuItemClass,
        danger ? "text-canvas-danger hover:bg-canvas-dangerSoft" : "",
      ].join(" ")}
    >
      <span className={danger ? "text-canvas-danger" : "text-canvas-muted"}>
        {icon}
      </span>
      <span>{label}</span>
    </button>
  );
}

export { menuItemClass };
