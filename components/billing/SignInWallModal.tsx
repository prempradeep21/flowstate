"use client";

import { useEffect, useState } from "react";
import { LogIn, Sparkles } from "lucide-react";
// Imported from the module directly rather than the @/components/motion barrel:
// the barrel also re-exports MotionCanvasNode, which pulls in the canvas store
// and its theme module, and that chain has a circular initialisation that only
// resolves when the full app bootstraps. Direct import keeps this standalone.
import {
  MotionBackdrop,
  MotionOverlayModal,
} from "@/components/motion/MotionOverlay";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

interface SignInWallModalProps {
  isOpen: boolean;
  /** Questions asked as a guest, if known. Shown only when > 0. */
  questionsAsked?: number | null;
  /** Wired to AuthProvider's signInWithGoogle by the caller. */
  onSignIn: () => Promise<void> | void;
  onDismiss: () => void;
}

/**
 * Shown when a signed-out visitor exhausts their guest allowance.
 *
 * This is a conversion moment, not a paywall, and the copy carries that: the
 * visitor has already built something they care about, and the fix is free and
 * one click. The single most important line is that their canvas survives —
 * `signInWithGoogle` stashes it before the OAuth redirect and re-adopts it on
 * return (AuthProvider → lib/guestCanvas), so the promise is real.
 *
 * `branch-ai.md` §3 says no modals for common actions. This is a terminal
 * state rather than a common action, so a modal is warranted — but it stays
 * dismissible, so the canvas behind it can still be read and panned.
 *
 * Purely presentational: it takes `onSignIn` rather than reaching for
 * `useAuth()`, so it renders standalone (see /dev/signin-wall) without
 * dragging the auth provider and canvas store in behind it.
 */
export function SignInWallModal({
  isOpen,
  questionsAsked,
  onSignIn,
  onDismiss,
}: SignInWallModalProps) {
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onDismiss();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [busy, isOpen, onDismiss]);

  const handleSignIn = async () => {
    setBusy(true);
    try {
      await onSignIn();
    } catch {
      setBusy(false); // on success the page navigates away, so only reset here
    }
  };

  return (
    <>
      <MotionBackdrop
        isOpen={isOpen}
        onClick={busy ? undefined : onDismiss}
        className="pointer-events-auto fixed inset-0 z-[100] bg-black/40"
      />
      {isOpen && (
        <div className="pointer-events-none fixed inset-0 z-[101] flex items-center justify-center p-4">
          <MotionOverlayModal
            isOpen={isOpen}
            className="pointer-events-auto w-full max-w-md rounded-canvas border border-canvas-border bg-canvas-card p-5 shadow-card"
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="signin-wall-title"
              aria-describedby="signin-wall-desc"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-canvas-md bg-canvas-accent/10 text-canvas-accent">
                <Icon icon={Sparkles} size="hero" />
              </span>

              <h2
                id="signin-wall-title"
                className="mt-3 text-canvas-heading font-semibold text-canvas-ink"
              >
                Sign in to keep building
              </h2>

              <p
                id="signin-wall-desc"
                className="mt-3 text-canvas-body leading-relaxed text-canvas-muted"
              >
                {questionsAsked && questionsAsked > 0 ? (
                  <>
                    You&rsquo;ve asked{" "}
                    <span className="font-medium text-canvas-ink">
                      {questionsAsked} question{questionsAsked === 1 ? "" : "s"}
                    </span>{" "}
                    without an account.{" "}
                  </>
                ) : (
                  <>You&rsquo;ve reached the end of the free preview. </>
                )}
                Signing in is free and takes a second —{" "}
                <span className="font-medium text-canvas-ink">
                  and this canvas comes with you
                </span>
                , exactly as you left it.
              </p>

              <div className="mt-5 flex justify-end gap-2">
                <Button variant="ghost" disabled={busy} onClick={onDismiss}>
                  Not now
                </Button>
                <Button
                  variant="primary"
                  icon={LogIn}
                  loading={busy}
                  onClick={handleSignIn}
                >
                  {busy ? "Signing in…" : "Sign in with Google"}
                </Button>
              </div>
            </div>
          </MotionOverlayModal>
        </div>
      )}
    </>
  );
}
