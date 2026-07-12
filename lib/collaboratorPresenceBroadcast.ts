import type { RealtimeChannel } from "@supabase/supabase-js";
import { clientToWorld } from "@/lib/canvasCoordinates";
import type { CollaboratorPresence } from "@/lib/collaborationTypes";

/**
 * Cursor positions ride the channel's BROADCAST primitive, not presence
 * `track()`: presence updates make the server diff + re-fan the whole
 * presence state to every subscriber (~O(members) work per update, 30/s per
 * user), which is the wrong primitive for a high-frequency stream. Presence
 * remains for join/leave/identity; 20/s broadcasts are visually identical
 * because the receiver rAF-interpolates between samples.
 */
export const CURSOR_BROADCAST_EVENT = "cursor";
export const PRESENCE_BROADCAST_INTERVAL_MS = 50;
export const PRESENCE_MIN_MOVE_WORLD_PX = 1;
export const PRESENCE_MAX_FLUSHES_PER_SEC = 20;
export const PRESENCE_OFF_SCREEN = -99999;

const MIN_FLUSH_INTERVAL_MS = 1000 / PRESENCE_MAX_FLUSHES_PER_SEC;

export function shouldFlushPresence(args: {
  now: number;
  lastFlushAt: number;
  lastWorldX: number;
  lastWorldY: number;
  nextWorldX: number;
  nextWorldY: number;
  viewportScale: number;
  dirty: boolean;
}): boolean {
  const {
    now,
    lastFlushAt,
    lastWorldX,
    lastWorldY,
    nextWorldX,
    nextWorldY,
    viewportScale,
    dirty,
  } = args;

  if (!dirty) return false;
  if (lastFlushAt === 0) return true;

  const elapsed = now - lastFlushAt;
  if (elapsed < MIN_FLUSH_INTERVAL_MS) return false;

  const dx = nextWorldX - lastWorldX;
  const dy = nextWorldY - lastWorldY;
  const minMove = PRESENCE_MIN_MOVE_WORLD_PX / Math.max(viewportScale, 0.001);
  return Math.hypot(dx, dy) >= minMove;
}

export function mergePresencePayload(
  base: CollaboratorPresence,
  worldX: number,
  worldY: number,
  now: number,
): CollaboratorPresence {
  return {
    ...base,
    worldX,
    worldY,
    updatedAt: now,
  };
}

export interface PresenceBroadcaster {
  updatePointer: (clientX: number, clientY: number, rect: DOMRect) => void;
  hide: () => void;
  destroy: () => void;
}

export function createPresenceBroadcaster(
  channel: RealtimeChannel,
  basePayload: CollaboratorPresence,
  getViewport: () => { x: number; y: number; scale: number },
): PresenceBroadcaster {
  let pendingWorldX = PRESENCE_OFF_SCREEN;
  let pendingWorldY = PRESENCE_OFF_SCREEN;
  let dirty = false;
  let lastFlushAt = 0;
  let lastWorldX = PRESENCE_OFF_SCREEN;
  let lastWorldY = PRESENCE_OFF_SCREEN;
  let tickId: ReturnType<typeof setInterval> | null = null;

  const flush = () => {
    if (document.visibilityState === "hidden") return;

    const now = Date.now();
    const viewport = getViewport();

    if (
      !shouldFlushPresence({
        now,
        lastFlushAt,
        lastWorldX,
        lastWorldY,
        nextWorldX: pendingWorldX,
        nextWorldY: pendingWorldY,
        viewportScale: viewport.scale,
        dirty,
      })
    ) {
      return;
    }

    dirty = false;
    lastFlushAt = now;
    lastWorldX = pendingWorldX;
    lastWorldY = pendingWorldY;

    const payload = mergePresencePayload(
      basePayload,
      pendingWorldX,
      pendingWorldY,
      now,
    );
    void channel.send({
      type: "broadcast",
      event: CURSOR_BROADCAST_EVENT,
      payload,
    });
  };

  const startTick = () => {
    if (tickId != null) return;
    tickId = setInterval(flush, PRESENCE_BROADCAST_INTERVAL_MS);
  };

  const stopTick = () => {
    if (tickId == null) return;
    clearInterval(tickId);
    tickId = null;
  };

  return {
    updatePointer(clientX, clientY, rect) {
      if (document.visibilityState === "hidden") return;
      const { worldX, worldY } = clientToWorld(
        clientX,
        clientY,
        rect,
        getViewport(),
      );
      pendingWorldX = worldX;
      pendingWorldY = worldY;
      const isFirstFlush = lastFlushAt === 0;
      dirty = true;
      startTick();
      if (isFirstFlush) flush();
    },

    hide() {
      if (document.visibilityState === "hidden") return;
      pendingWorldX = PRESENCE_OFF_SCREEN;
      pendingWorldY = PRESENCE_OFF_SCREEN;
      dirty = false;
      const now = Date.now();
      lastFlushAt = now;
      lastWorldX = PRESENCE_OFF_SCREEN;
      lastWorldY = PRESENCE_OFF_SCREEN;
      const payload = mergePresencePayload(
        basePayload,
        PRESENCE_OFF_SCREEN,
        PRESENCE_OFF_SCREEN,
        now,
      );
      // Broadcast hides live clients immediately; track() persists the
      // off-screen position as the authoritative presence state so late
      // joiners never see a stale cursor.
      void channel.send({
        type: "broadcast",
        event: CURSOR_BROADCAST_EVENT,
        payload,
      });
      void channel.track(payload);
    },

    destroy() {
      stopTick();
      dirty = false;
    },
  };
}
