"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { collaboratorColor } from "@/lib/collaboratorColors";
import { clientToWorld, worldToScreen } from "@/lib/canvasCoordinates";
import type { CollaboratorPresence } from "@/lib/collaborationTypes";
import { useCanvasStore } from "@/lib/store";

const CURSOR_TIMEOUT_MS = 3000;
const BROADCAST_INTERVAL_MS = 33;
const MIN_MOVE_PX = 4;

interface RemoteCursor extends CollaboratorPresence {
  screenX: number;
  screenY: number;
}

export function CollaboratorCursors({
  containerRef,
  channelRef,
  currentUserId,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  channelRef: React.RefObject<RealtimeChannel | null>;
  currentUserId: string | undefined;
}) {
  const [remoteCursors, setRemoteCursors] = useState<RemoteCursor[]>([]);
  const lastBroadcastRef = useRef({ worldX: 0, worldY: 0, at: 0 });
  const presencePayloadRef = useRef<CollaboratorPresence | null>(null);

  useEffect(() => {
    const channel = channelRef.current;
    if (!channel) return;

    const sync = () => {
      const state = channel.presenceState<CollaboratorPresence>();
      const now = Date.now();
      const container = containerRef.current;
      if (!container) return;

      const viewport = useCanvasStore.getState().viewport;
      const cursors: RemoteCursor[] = [];
      for (const key of Object.keys(state)) {
        if (key === currentUserId) continue;
        const entries = state[key];
        const latest = entries?.[entries.length - 1];
        if (!latest) continue;
        if (now - latest.updatedAt > CURSOR_TIMEOUT_MS) continue;
        if (typeof latest.worldX !== "number" || typeof latest.worldY !== "number") {
          continue;
        }
        const { screenX, screenY } = worldToScreen(
          latest.worldX,
          latest.worldY,
          viewport,
        );
        cursors.push({ ...latest, screenX, screenY });
      }
      setRemoteCursors(cursors);
    };

    // Channel is subscribed in useCollaboration; presence handlers must be
    // registered before subscribe(), so poll presenceState instead.
    sync();

    const interval = setInterval(sync, 200);
    return () => {
      clearInterval(interval);
    };
  }, [channelRef, containerRef, currentUserId]);

  const broadcastCursor = useCallback(
    (clientX: number, clientY: number) => {
      const channel = channelRef.current;
      const container = containerRef.current;
      if (!channel || !container || !currentUserId || !presencePayloadRef.current) {
        return;
      }

      const viewport = useCanvasStore.getState().viewport;
      const rect = container.getBoundingClientRect();
      const { worldX, worldY } = clientToWorld(
        clientX,
        clientY,
        rect,
        viewport,
      );

      const now = Date.now();
      const last = lastBroadcastRef.current;
      const dx = worldX - last.worldX;
      const dy = worldY - last.worldY;
      const dist = Math.hypot(dx, dy);

      if (
        now - last.at < BROADCAST_INTERVAL_MS &&
        dist < MIN_MOVE_PX / viewport.scale
      ) {
        return;
      }

      lastBroadcastRef.current = { worldX, worldY, at: now };

      const payload: CollaboratorPresence = {
        ...presencePayloadRef.current,
        worldX,
        worldY,
        updatedAt: now,
      };

      void channel.track(payload);
    },
    [channelRef, containerRef, currentUserId],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !currentUserId) return;

    const onMove = (e: PointerEvent) => {
      if (document.visibilityState === "hidden") return;
      broadcastCursor(e.clientX, e.clientY);
    };

    const onLeave = () => {
      const channel = channelRef.current;
      if (!channel || !presencePayloadRef.current) return;
      void channel.track({
        ...presencePayloadRef.current,
        worldX: -99999,
        worldY: -99999,
        updatedAt: Date.now(),
      });
    };

    container.addEventListener("pointermove", onMove);
    container.addEventListener("pointerleave", onLeave);
    return () => {
      container.removeEventListener("pointermove", onMove);
      container.removeEventListener("pointerleave", onLeave);
    };
  }, [broadcastCursor, channelRef, containerRef, currentUserId]);

  useEffect(() => {
    if (!currentUserId) return;
    const channel = channelRef.current;
    if (!channel) return;

    const meta = channel.presenceState()[currentUserId]?.[0] as
      | Record<string, unknown>
      | undefined;

    presencePayloadRef.current = {
      userId: currentUserId,
      displayName:
        typeof meta?.displayName === "string" ? meta.displayName : "User",
      avatarUrl:
        typeof meta?.avatarUrl === "string" ? meta.avatarUrl : undefined,
      color: collaboratorColor(currentUserId),
      worldX: 0,
      worldY: 0,
      updatedAt: Date.now(),
    };
  }, [channelRef, currentUserId]);

  if (remoteCursors.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-[45] overflow-hidden">
      {remoteCursors.map((cursor) => (
        <div
          key={cursor.userId}
          className="absolute transition-transform duration-100 ease-out"
          style={{
            transform: `translate(${cursor.screenX}px, ${cursor.screenY}px)`,
          }}
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
            className="ml-3 -mt-1 flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-white shadow-sm"
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
