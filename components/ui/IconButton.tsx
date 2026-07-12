"use client";

import type { LucideIcon } from "lucide-react";
import { Icon, type IconSize } from "@/components/ui/Icon";

type IconButtonSize = "sm" | "md" | "lg";

const BUTTON_SIZE_CLASS: Record<IconButtonSize, string> = {
  sm: "h-7 w-7",
  md: "h-9 w-9",
  lg: "h-11 w-11",
};

const ICON_SIZE_FOR_BUTTON: Record<IconButtonSize, IconSize> = {
  sm: "control",
  md: "control",
  lg: "toolbar",
};

/**
 * Standard icon-only button — consistent hit target, radius, and hover
 * treatment for chrome controls (toolbar, panel headers, popovers).
 */
export function IconButton({
  icon,
  label,
  onClick,
  size = "md",
  active = false,
  disabled = false,
  className = "",
}: {
  icon: LucideIcon;
  /** Accessible name; also used as the tooltip. */
  label: string;
  onClick?: () => void;
  size?: IconButtonSize;
  active?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center rounded-canvas-md transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        BUTTON_SIZE_CLASS[size]
      } ${
        active
          ? "bg-canvas-accentSoft text-canvas-accent"
          : "text-canvas-muted hover:bg-canvas-bg hover:text-canvas-ink"
      } ${className}`}
    >
      <Icon icon={icon} size={ICON_SIZE_FOR_BUTTON[size]} />
    </button>
  );
}
