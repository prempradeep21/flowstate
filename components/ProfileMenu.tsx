"use client";

import { ChevronDown, LogOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { ContextMenuItem } from "@/components/MenuIcons";
import { MotionOverlayPopover } from "@/components/motion/MotionOverlay";
import { Icon } from "@/components/ui/Icon";

/**
 * The signed-in user's avatar + name as a button. Account actions (Sign out)
 * live in the menu it opens rather than sitting beside it as their own
 * buttons. `placement` picks which way the menu opens — "up" for the sidebar
 * footer, "down" for a top header.
 */
export function ProfileMenu({
  placement = "down",
  align = "left",
  textClassName = "text-canvas-body-sm",
  showNameOnMobile = true,
}: {
  placement?: "up" | "down";
  align?: "left" | "right";
  textClassName?: string;
  showNameOnMobile?: boolean;
}) {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [open]);

  if (!user) return null;

  const name =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    user.email ??
    "Account";
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;

  const avatar = (sizeClass: string) =>
    avatarUrl ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt=""
        className={`${sizeClass} shrink-0 rounded-full object-cover`}
      />
    ) : (
      <span
        className={`flex ${sizeClass} shrink-0 items-center justify-center rounded-full bg-canvas-accent text-canvas-compact font-semibold text-canvas-onAccent`}
      >
        {name.charAt(0).toUpperCase()}
      </span>
    );

  return (
    <div ref={rootRef} className="pointer-events-auto relative min-w-0">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`flex min-w-0 items-center gap-2 rounded-full border py-0.5 pl-0.5 pr-2.5 transition-colors ${
          open
            ? "border-canvas-accent/40 bg-canvas-accentSoft"
            : "border-canvas-border/60 bg-canvas-card/90 hover:border-canvas-accent/30 hover:bg-canvas-bg"
        }`}
      >
        {avatar("h-7 w-7")}
        <span
          className={`max-w-[12rem] truncate ${textClassName} text-canvas-ink ${
            showNameOnMobile ? "" : "hidden sm:inline"
          }`}
        >
          {name}
        </span>
        <Icon
          icon={ChevronDown}
          size="inline"
          // Points the way the menu opens, flipping back once it's open.
          className={`shrink-0 text-canvas-muted transition-transform duration-motion-fast ${
            (placement === "up") !== open ? "rotate-180" : ""
          }`}
        />
      </button>

      <MotionOverlayPopover
        isOpen={open}
        className={`absolute z-50 w-[15rem] overflow-hidden rounded-canvas border border-canvas-border bg-canvas-card py-1 shadow-card ${
          placement === "up" ? "bottom-full mb-2" : "top-full mt-2"
        } ${align === "left" ? "left-0" : "right-0"}`}
        style={{
          transformOrigin: `${placement === "up" ? "bottom" : "top"} ${align}`,
        }}
      >
        <div role="menu" aria-label="Account">
          <div className="flex items-center gap-2.5 px-3 py-2">
            {avatar("h-8 w-8")}
            <div className="min-w-0">
              <p className="truncate text-canvas-body-sm font-medium text-canvas-ink">
                {name}
              </p>
              {user.email && user.email !== name ? (
                <p className="truncate text-canvas-micro text-canvas-muted">
                  {user.email}
                </p>
              ) : null}
            </div>
          </div>
          <div className="my-1 border-t border-canvas-border" role="separator" />
          <ContextMenuItem
            icon={<Icon icon={LogOut} />}
            label={busy ? "Signing out…" : "Sign out"}
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await signOut();
              } finally {
                setBusy(false);
                setOpen(false);
              }
            }}
          />
        </div>
      </MotionOverlayPopover>
    </div>
  );
}
