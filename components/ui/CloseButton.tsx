"use client";

import { X } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";

/**
 * Standard dismiss control for modals, popovers, and panels — replaces
 * ad-hoc `✕`/`×` text glyphs so every close affordance shares the same
 * icon, hit target, and hover treatment.
 */
export function CloseButton({
  onClick,
  label = "Close",
  size = "sm",
  className = "",
}: {
  onClick?: () => void;
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <IconButton
      icon={X}
      label={label}
      onClick={onClick}
      size={size}
      className={className}
    />
  );
}
