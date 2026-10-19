"use client";

import { useAuth } from "@/components/AuthProvider";
import {
  resolvePublishedCanvasIdentity,
  type PublishedCanvasIdentity,
} from "@/lib/publishedCanvasIdentity";
import { useCanvasStore } from "@/lib/store";

export interface PublishedCanvasChip
  extends Omit<PublishedCanvasIdentity, "action"> {
  action: { label: string; run: () => void } | null;
}

/**
 * Binds `resolvePublishedCanvasIdentity` to the live session — see that
 * function for what the chip says and why.
 */
export function usePublishedCanvasIdentity(): PublishedCanvasChip | null {
  const origin = useCanvasStore((s) => s.publishedOrigin);
  const {
    user,
    signInWithGoogle,
    supabaseConfigured,
    localReadOnly,
    adoptPublishedCanvasFork,
  } = useAuth();

  const identity = resolvePublishedCanvasIdentity({
    origin,
    signedIn: user !== null,
    supabaseConfigured,
    localReadOnly,
  });
  if (!identity) return null;

  const { action } = identity;
  return {
    ...identity,
    action: action
      ? {
          label: action.label,
          run:
            action.kind === "sign-in"
              ? () => void signInWithGoogle()
              : () => void adoptPublishedCanvasFork(),
        }
      : null,
  };
}
