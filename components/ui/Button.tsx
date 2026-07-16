"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2, type LucideIcon } from "lucide-react";
import { Icon } from "@/components/ui/Icon";

/**
 * Shared text-button primitive — the one way to render an action button.
 *
 * Hierarchy rules (Stripe/Base-derived):
 * - `secondary` is the DEFAULT. Promote to `primary` deliberately —
 *   at most ONE primary per surface (modal, panel, toolbar, view).
 * - `ghost` for low-emphasis chrome actions (toolbar rows, panel affordances).
 * - `link` for inline dismissive/tertiary actions (Cancel, Skip).
 * - `tone="danger"` crosses with any variant: `primary`+danger = destructive
 *   confirm, `secondary`+danger = outline danger.
 * - `shape="pill"` is reserved for floating/standalone chrome (artifact-header
 *   CTAs, auth chip); buttons inside rectangular containers keep
 *   `rounded-canvas-md` so they track the radius knob.
 *
 * Hover/press feedback comes from the shared `.btn` state layer in
 * globals.css — do not add per-button `hover:bg-*` classes.
 * Icon-only buttons: use `IconButton` instead.
 */
export type ButtonVariant = "primary" | "secondary" | "ghost" | "link";
export type ButtonTone = "default" | "danger";
export type ButtonSize = "sm" | "md" | "lg";
export type ButtonShape = "default" | "pill";

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: "h-7 gap-1.5 px-2.5 text-canvas-compact",
  md: "h-9 gap-2 px-3.5 text-canvas-body-sm",
  lg: "h-11 gap-2 px-4 text-canvas-body",
};

/** tone × variant → fill/border/text. Interaction physics live in `.btn`. */
const VARIANT_CLASS: Record<ButtonTone, Record<ButtonVariant, string>> = {
  default: {
    primary: "bg-canvas-accent text-canvas-onAccent",
    secondary: "border border-canvas-border bg-canvas-card text-canvas-ink",
    ghost: "text-canvas-muted hover:text-canvas-ink",
    link: "btn-quiet h-auto px-0 text-canvas-accent underline-offset-2 hover:underline",
  },
  danger: {
    primary: "bg-canvas-danger text-canvas-onDanger",
    secondary: "border border-canvas-dangerBorder bg-canvas-card text-canvas-danger",
    ghost: "text-canvas-danger",
    link: "btn-quiet h-auto px-0 text-canvas-danger underline-offset-2 hover:underline",
  },
};

/**
 * Class-string escape hatch for `<a>`/`<Link>`/`<label>` call sites that
 * must look like a Button. Wrap text children in a `<span>` so they stack
 * above the state layer.
 */
export function buttonClasses(
  opts: {
    variant?: ButtonVariant;
    tone?: ButtonTone;
    size?: ButtonSize;
    shape?: ButtonShape;
    className?: string;
  } = {},
): string {
  const {
    variant = "secondary",
    tone = "default",
    size = "md",
    shape = "default",
    className = "",
  } = opts;
  return [
    "btn select-none font-medium",
    shape === "pill" ? "rounded-full" : "rounded-canvas-md",
    SIZE_CLASS[size],
    VARIANT_CLASS[tone][variant],
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  tone?: ButtonTone;
  size?: ButtonSize;
  shape?: ButtonShape;
  /** Optional leading icon. */
  icon?: LucideIcon;
  /** Spinner replaces the icon slot; button is disabled + aria-busy. */
  loading?: boolean;
  children?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant,
      tone,
      size = "md",
      shape,
      icon,
      loading = false,
      disabled,
      className,
      children,
      type = "button",
      ...rest
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={buttonClasses({ variant, tone, size, shape, className })}
        {...rest}
      >
        {loading ? (
          <Icon icon={Loader2} size="control" className="animate-spin" />
        ) : icon ? (
          <Icon icon={icon} size="control" />
        ) : null}
        {children != null ? <span>{children}</span> : null}
      </button>
    );
  },
);
