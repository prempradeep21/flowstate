"use client";

import { useEffect, useState } from "react";
import { fetchCanvasesMembers } from "@/lib/collaborationPersistence";
import { createClient } from "@/lib/supabase/client";
import type { CanvasMember } from "@/lib/collaborationTypes";

/**
 * Loads collaborator member lists for the canvases that are actually shared, so
 * Home cards can show a Figma-style avatar stack. Returns a map keyed by canvas
 * id. Does nothing (zero queries) when no canvas is shared — the common case.
 */
export function useHomeCanvasCollaborators(
  sharedCanvasIds: string[],
  enabled: boolean,
): Record<string, CanvasMember[]> {
  const [members, setMembers] = useState<Record<string, CanvasMember[]>>({});

  // Stable key so the effect only re-runs when the set of ids actually changes.
  const idsKey = [...sharedCanvasIds].sort().join(",");

  useEffect(() => {
    if (!enabled || !idsKey) {
      setMembers({});
      return;
    }

    let cancelled = false;
    const ids = idsKey.split(",");

    void (async () => {
      try {
        const supabase = createClient();
        const map = await fetchCanvasesMembers(supabase, ids);
        if (!cancelled) setMembers(map);
      } catch {
        if (!cancelled) setMembers({});
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, idsKey]);

  return members;
}
