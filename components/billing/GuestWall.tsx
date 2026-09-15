"use client";

import { useAuth } from "@/components/AuthProvider";
import { SignInWallModal } from "@/components/billing/SignInWallModal";
import { useCanvasStore } from "@/lib/store";

/**
 * Container for the guest sign-in wall: connects the store flag that
 * lib/claudeClient sets on a 402 to the presentational modal, and supplies the
 * real sign-in action.
 *
 * Renders nothing for signed-in users — the wall is guests-only by definition.
 */
export function GuestWall() {
  const { user, signInWithGoogle } = useAuth();
  const guestWall = useCanvasStore((s) => s.guestWall);
  const dismissGuestWall = useCanvasStore((s) => s.dismissGuestWall);

  if (user) return null;

  return (
    <SignInWallModal
      isOpen={guestWall.open}
      questionsAsked={guestWall.questionsAsked}
      onSignIn={signInWithGoogle}
      onDismiss={dismissGuestWall}
    />
  );
}
