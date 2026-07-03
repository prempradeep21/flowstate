"use client";

import type { ReactNode } from "react";
import { MotionFlowSize } from "@/components/motion/MotionFlowSize";

export type ArtifactNestedMenuView = "root" | "display" | "export";

const menuItemClass =
  "flex w-full items-center gap-2.5 px-3 py-2 text-left text-canvas-body-sm text-canvas-ink transition-colors hover:bg-canvas-bg disabled:cursor-not-allowed disabled:opacity-40";

function ChevronRightIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="ml-auto h-4 w-4 shrink-0 text-canvas-muted"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-4 w-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M10 4L6 8l4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ArtifactNestedMenuShell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <MotionFlowSize
      role="menu"
      className={`motion-popover-in overflow-hidden py-1 ${className}`}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {children}
    </MotionFlowSize>
  );
}

export function ArtifactNestedMenuBackHeader({
  title,
  onBack,
}: {
  title: string;
  onBack: () => void;
}) {
  return (
    <div className="flex items-center gap-1 border-b border-canvas-border px-1 py-1">
      <button
        type="button"
        onClick={onBack}
        className={`${menuItemClass} flex-1 rounded-canvas-xs font-medium`}
      >
        <BackIcon />
        <span>Back</span>
      </button>
      <span className="sr-only">{title}</span>
    </div>
  );
}

export function ArtifactNestedMenuNavItem({
  label,
  onNavigate,
}: {
  label: string;
  onNavigate: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onNavigate}
      className={menuItemClass}
    >
      <span className="min-w-0 flex-1">{label}</span>
      <ChevronRightIcon />
    </button>
  );
}

export function ArtifactNestedMenuSection({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className="px-3 py-2">
      {title ? (
        <p className="mb-2 text-canvas-micro font-medium uppercase tracking-wide text-canvas-muted">
          {title}
        </p>
      ) : null}
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

export const artifactMenuSelectClass =
  "h-8 w-full min-w-0 rounded-canvas-md border border-canvas-border bg-canvas-bg py-1 pl-2.5 pr-8 text-canvas-body-sm normal-case tracking-normal text-canvas-ink outline-none transition-colors focus-visible:border-canvas-accent/50 focus-visible:ring-1 focus-visible:ring-canvas-accent/30";

export const artifactMenuFieldLabelClass =
  "mb-1 block text-canvas-micro font-medium uppercase tracking-wide text-canvas-muted";
