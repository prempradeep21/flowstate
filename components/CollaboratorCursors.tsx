"use client";

import { useEffect, useMemo, useRef } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { collaboratorColor } from "@/lib/collaboratorColors";
import { worldToScreen } from "@/lib/canvasCoordinates";
import {
  createPresenceBroadcaster,
  PRESENCE_OFF_SCREEN,
} from "@/lib/collaboratorPresenceBroadcast";
import type { CollaboratorPresence } from "@/lib/collaborationTypes";
import { useRemotePresence, useRemotePresenceVersion } from "@/hooks/useRemotePresence";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";
import { useCanvasStore } from "@/lib/store";

const CURSOR_TIMEOUT_MS = 3000;

interface CursorSample {
  worldX: number;
  worldY: number;
  t: number;
}

interface CursorSampleBuffer {
  prev: CursorSample | null;
  next: CursorSample;
}

function isCursorVisible(presence: CollaboratorPresence, now: number): boolean {
  if (presence.worldX === PRESENCE_OFF_SCREEN) return false;
  if (now - presence.updatedAt > CURSOR_TIMEOUT_MS) return false;
  return true;
}

export function CollaboratorCursors({
  containerRef,
  channelRef,
  channelReady,
  currentUserId,
  displayName,
  avatarUrl,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  channelRef: React.RefObject<RealtimeChannel | null>;
  channelReady: boolean;
  currentUserId: string | undefined;
  displayName?: string;
  avatarUrl?: string;
}) {
  const remotePresence = useRemotePresence();
  const presenceVersion = useRemotePresenceVersion();
  const reducedMotion = useReducedMotion();

  const shellRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const buffersRef = useRef<Map<string, CursorSampleBuffer>>(new Map());
  const rafRef = useRef(0);
  const reducedMotionRef = useRef(reducedMotion);
  const remotePresenceRef = useRef(remotePresence);

  reducedMotionRef.current = reducedMotion;
  remotePresenceRef.current = remotePresence;

  useEffect(() => {
    const now = performance.now();
    const presence = remotePresenceRef.current;

    for (const userId of buffersRef.current.keys()) {
      if (!presence[userId] || userId === currentUserId) {
        buffersRef.current.delete(userId);
      }
    }

    for (const [userId, p] of Object.entries(presence)) {
      if (userId === currentUserId) continue;

      const existing = buffersRef.current.get(userId);
      const sample: CursorSample = {
        worldX: p.worldX,
        worldY: p.worldY,
        t: now,
      };

      if (!existing) {
        buffersRef.current.set(userId, { prev: null, next: sample });
        continue;
      }

      if (
        existing.next.worldX === sample.worldX &&
        existing.next.worldY === sample.worldY
      ) {
        continue;
      }

      buffersRef.current.set(userId, {
        prev: existing.next,
        next: sample,
      });
    }
  }, [presenceVersion, currentUserId]);

  useEffect(() => {
    const hasRemoteUsers = Object.keys(remotePresence).some(
      (id) => id !== currentUserId,
    );
    if (!hasRemoteUsers) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
      return;
    }

    const tick = () => {
      const viewport = useCanvasStore.getState().viewport;
      const now = performance.now();
      const clock = Date.now();
      const presence = remotePresenceRef.current;
      const snap = reducedMotionRef.current;

      for (const [userId, buffer] of buffersRef.current) {
        const el = shellRefs.current.get(userId);
        if (!el) continue;

        const meta = presence[userId];
        if (!meta || !isCursorVisible(meta, clock)) {
          el.style.display = "none";
          continue;
        }

        let worldX: number;
        let worldY: number;

        if (snap || !buffer.prev) {
          worldX = buffer.next.worldX;
          worldY = buffer.next.worldY;
        } else {
          const span = buffer.next.t - buffer.prev.t;
          const alpha =
            span <= 0
              ? 1
              : Math.min(1, Math.max(0, (now - buffer.prev.t) / span));
          worldX =
            buffer.prev.worldX +
            (buffer.next.worldX - buffer.prev.worldX) * alpha;
          worldY =
            buffer.prev.worldY +
            (buffer.next.worldY - buffer.prev.worldY) * alpha;
        }

        const { screenX, screenY } = worldToScreen(worldX, worldY, viewport);
        el.style.display = "";
        el.style.transform = `translate3d(${screenX}px, ${screenY}px, 0)`;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
    };
  }, [remotePresence, currentUserId]);

  useEffect(() => {
    if (!channelReady || !currentUserId) return;

    const channel = channelRef.current;
    const container = containerRef.current;
    if (!channel || !container) return;

    const basePayload: CollaboratorPresence = {
      userId: currentUserId,
      displayName: displayName ?? "User",
      avatarUrl,
      color: collaboratorColor(currentUserId),
      worldX: PRESENCE_OFF_SCREEN,
      worldY: PRESENCE_OFF_SCREEN,
      updatedAt: Date.now(),
    };

    const broadcaster = createPresenceBroadcaster(
      channel,
      basePayload,
      () => useCanvasStore.getState().viewport,
    );

    const onMove = (e: PointerEvent) => {
      if (document.visibilityState === "hidden") return;
      broadcaster.updatePointer(
        e.clientX,
        e.clientY,
        container.getBoundingClientRect(),
      );
    };

    const onLeave = () => {
      broadcaster.hide();
    };

    container.addEventListener("pointermove", onMove);
    container.addEventListener("pointerleave", onLeave);

    return () => {
      container.removeEventListener("pointermove", onMove);
      container.removeEventListener("pointerleave", onLeave);
      broadcaster.destroy();
    };
  }, [
    avatarUrl,
    channelReady,
    channelRef,
    containerRef,
    currentUserId,
    displayName,
  ]);

  const shellUsers = useMemo(() => {
    const ids = new Set<string>();
    for (const userId of Object.keys(remotePresence)) {
      if (userId !== currentUserId) ids.add(userId);
    }
    return Array.from(ids)
      .map((id) => remotePresence[id])
      .filter((p): p is CollaboratorPresence => Boolean(p));
  }, [remotePresence, currentUserId]);

  if (shellUsers.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-[45] overflow-hidden">
      {shellUsers.map((cursor) => (
        <div
          key={cursor.userId}
          ref={(el) => {
            if (el) shellRefs.current.set(cursor.userId, el);
            else shellRefs.current.delete(cursor.userId);
          }}
          className="absolute will-change-transform"
          style={{ transform: "translate3d(0px, 0px, 0px)", display: "none" }}
        >
          <svg
            width="16"
            height="20"
            viewBox="0 0 16 20"
            fill="none"
            aria-hidden
            className="drop-shadow-sm"
          >
            <path
              d="M1 1L1 15.5L5.5 11.5L8.5 18.5L10.5 17.5L7.5 10.5L13 10.5L1 1Z"
              fill={cursor.color}
              stroke="white"
              strokeWidth="1.2"
            />
          </svg>
          <div
            className="ml-3 -mt-1 flex items-center gap-1 rounded-full px-2 py-0.5 text-canvas-caption font-medium text-white shadow-sm"
            style={{ backgroundColor: cursor.color }}
          >
            {cursor.avatarUrl && (
              <img
                src={cursor.avatarUrl}
                alt=""
                className="h-4 w-4 rounded-full object-cover"
              />
            )}
            <span className="max-w-[100px] truncate">{cursor.displayName}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
