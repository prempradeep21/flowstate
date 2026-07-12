"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";
import {
  acceptCanvasInvite,
  canEditCanvas,
  declineCanvasInvite,
  duplicateCanvasForUser,
  fetchOwnedCanvasShareFlags,
  fetchCanvasAccessInfo,
  fetchCanvasInvitesForOwner,
  fetchCanvasMembers,
  fetchOwnerProfile,
  fetchPendingInvitesForUser,
  fetchSharedCanvasList,
  getOrCreateShareLink,
  inviteToCanvasByEmail,
  joinCanvasViaShareLink,
  leaveSharedCanvas,
  processPendingInvitesForEmail,
  removeCanvasCollaborator,
  revokeShareLink,
  setAllowViewerDuplicate,
  transferCanvasOwnership,
  updateCollaboratorRole,
  buildDuplicateTitle,
} from "@/lib/collaborationPersistence";
import type {
  CanvasAccessInfo,
  CanvasInvite,
  CanvasMember,
  CanvasRole,
  CanvasShareLink,
  CollaboratorPresence,
  CollaboratorRole,
  SharedCanvasMeta,
} from "@/lib/collaborationTypes";
import { collaboratorColor } from "@/lib/collaboratorColors";
import { PRESENCE_OFF_SCREEN } from "@/lib/collaboratorPresenceBroadcast";
import {
  clearRemotePresence,
  parsePresenceState,
  setRemotePresence,
} from "@/lib/remotePresenceStore";
import { buildCanvasSnapshot, parseCanvasSnapshot } from "@/lib/canvasSnapshot";
import {
  areCanvasPersistSlicesEqual,
  pickCanvasPersistSlice,
  pickCanvasPersistSliceFromSnapshot,
} from "@/lib/canvasPersistDirty";
import { applyOps, type CanvasOpBatch } from "@/lib/canvasOps";
import {
  CANVAS_OPS_EVENT,
  canvasOpsEnabled,
  setCanvasOpsChannel,
  wasBatchSentLocally,
} from "@/lib/collabOpsChannel";
import { hasActiveLocalEdits } from "@/lib/localEditGuard";
import { createClient } from "@/lib/supabase/client";
import { useCanvasStore } from "@/lib/store";

interface UseCollaborationOptions {
  user: User | null;
  supabaseConfigured: boolean;
  activeCanvasId: string | null;
  localReadOnly?: boolean;
  onCanvasJoined: (canvasId: string) => Promise<void>;
  onRefreshCanvasList: () => Promise<void>;
  isRemoteUpdateRef: React.MutableRefObject<boolean>;
  isDirtyRef?: React.MutableRefObject<boolean>;
  isHydratingRef?: React.MutableRefObject<boolean>;
  /** Last known row `updated_at` from load/save — skips self-echo realtime events. */
  canvasUpdatedAtRef?: React.MutableRefObject<string | null>;
}

export function useCollaboration({
  user,
  supabaseConfigured,
  activeCanvasId,
  localReadOnly = false,
  onCanvasJoined,
  onRefreshCanvasList,
  isRemoteUpdateRef,
  isDirtyRef,
  isHydratingRef,
  canvasUpdatedAtRef,
}: UseCollaborationOptions) {
  const [sharedCanvases, setSharedCanvases] = useState<SharedCanvasMeta[]>([]);
  const [pendingInvites, setPendingInvites] = useState<CanvasInvite[]>([]);
  const [canvasInvites, setCanvasInvites] = useState<CanvasInvite[]>([]);
  const [members, setMembers] = useState<CanvasMember[]>([]);
  const [accessInfo, setAccessInfo] = useState<CanvasAccessInfo | null>(null);
  const [shareLink, setShareLink] = useState<CanvasShareLink | null>(null);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [presenceChannelReady, setPresenceChannelReady] = useState(false);
  const [collaborationHasEdits, setCollaborationHasEdits] = useState(false);
  const [ownedCanvasShareFlags, setOwnedCanvasShareFlags] = useState<
    Record<string, boolean>
  >({});

  const presenceChannelRef = useRef<RealtimeChannel | null>(null);
  const realtimeChannelRef = useRef<RealtimeChannel | null>(null);
  const pendingRemoteSnapshotRef = useRef<ReturnType<
    typeof parseCanvasSnapshot
  > | null>(null);
  const pendingRemoteUpdatedAtRef = useRef<string | null>(null);

  const hydrateFromSnapshot = useCanvasStore((s) => s.hydrateFromSnapshot);
  const getSnapshotSource = useCanvasStore((s) => s.getCanvasSnapshotSource);

  const applyPendingRemoteSnapshot = useCallback(() => {
    const pending = pendingRemoteSnapshotRef.current;
    if (!pending || isDirtyRef?.current || hasActiveLocalEdits()) return;
    if (useCanvasStore.getState().activeCanvasStrokeId) return;

    pendingRemoteSnapshotRef.current = null;
    const updatedAt = pendingRemoteUpdatedAtRef.current;
    pendingRemoteUpdatedAtRef.current = null;

    const currentSlice = pickCanvasPersistSlice(useCanvasStore.getState());
    const incomingSlice = pickCanvasPersistSliceFromSnapshot(pending);
    if (areCanvasPersistSlicesEqual(currentSlice, incomingSlice)) {
      if (updatedAt && canvasUpdatedAtRef) canvasUpdatedAtRef.current = updatedAt;
      return;
    }

    isRemoteUpdateRef.current = true;
    hydrateFromSnapshot(pending, {
      applyViewport: false,
      preserveEphemeral: true,
    });
    if (updatedAt && canvasUpdatedAtRef) canvasUpdatedAtRef.current = updatedAt;
    requestAnimationFrame(() => {
      isRemoteUpdateRef.current = false;
    });
  }, [
    canvasUpdatedAtRef,
    hydrateFromSnapshot,
    isDirtyRef,
    isRemoteUpdateRef,
  ]);

  const considerRemoteSnapshot = useCallback(
    (parsed: NonNullable<ReturnType<typeof parseCanvasSnapshot>>, updatedAt?: string) => {
      if (localReadOnly) return;

      if (isHydratingRef?.current) return;

      const reveal = useCanvasStore.getState().canvasLoadReveal;
      if (reveal?.phase === "pending" || reveal?.phase === "running") {
        return;
      }

      if (
        updatedAt &&
        canvasUpdatedAtRef?.current &&
        updatedAt === canvasUpdatedAtRef.current
      ) {
        return;
      }

      const currentSlice = pickCanvasPersistSlice(useCanvasStore.getState());
      const incomingSlice = pickCanvasPersistSliceFromSnapshot(parsed);
      if (areCanvasPersistSlicesEqual(currentSlice, incomingSlice)) {
        if (updatedAt && canvasUpdatedAtRef) canvasUpdatedAtRef.current = updatedAt;
        return;
      }

      if (isDirtyRef?.current || hasActiveLocalEdits()) {
        pendingRemoteSnapshotRef.current = parsed;
        pendingRemoteUpdatedAtRef.current = updatedAt ?? null;
        return;
      }

      if (useCanvasStore.getState().activeCanvasStrokeId) {
        pendingRemoteSnapshotRef.current = parsed;
        pendingRemoteUpdatedAtRef.current = updatedAt ?? null;
        return;
      }

      pendingRemoteSnapshotRef.current = null;
      pendingRemoteUpdatedAtRef.current = null;
      isRemoteUpdateRef.current = true;
      hydrateFromSnapshot(parsed, {
        applyViewport: false,
        preserveEphemeral: true,
      });
      if (updatedAt && canvasUpdatedAtRef) canvasUpdatedAtRef.current = updatedAt;
      requestAnimationFrame(() => {
        isRemoteUpdateRef.current = false;
      });
    },
    [
      canvasUpdatedAtRef,
      hydrateFromSnapshot,
      isDirtyRef,
      isHydratingRef,
      isRemoteUpdateRef,
      localReadOnly,
    ],
  );

  const activeCanvasRole: CanvasRole | null = accessInfo?.role ?? null;
  // Local sessions (localhost read-only sandbox) keep canvases in-memory —
  // there is no DB row to derive a role from, so the access fetch always
  // came back null and the user's OWN canvases rendered read-only (disabled
  // toolbar, no artifacts). On their machine they own everything; "read
  // only" refers to the production DB, which the persistence layer already
  // enforces by caching edits as session snapshots instead of writing.
  const canEdit = localReadOnly || canEditCanvas(activeCanvasRole);

  const refreshSharedAndInvites = useCallback(async () => {
    if (!user || !supabaseConfigured) {
      setSharedCanvases([]);
      setPendingInvites([]);
      setOwnedCanvasShareFlags({});
      return;
    }

    const supabase = createClient();
    await processPendingInvitesForEmail(
      supabase,
      user.id,
      user.email ?? "",
    );

    try {
      const [shared, pending, shareFlags] = await Promise.all([
        fetchSharedCanvasList(supabase, user.id),
        user.email
          ? fetchPendingInvitesForUser(supabase, user.email)
          : Promise.resolve([]),
        fetchOwnedCanvasShareFlags(supabase, user.id),
      ]);

      setSharedCanvases(shared);
      setPendingInvites(pending);
      setOwnedCanvasShareFlags(shareFlags);
    } catch (err) {
      console.warn("[collab] refresh shared canvases failed:", err);
      setSharedCanvases([]);
      setPendingInvites([]);
      setOwnedCanvasShareFlags({});
    }
  }, [supabaseConfigured, user]);

  const refreshActiveCanvasCollaboration = useCallback(async () => {
    // Local sessions have no canvas rows / members / invites to fetch —
    // querying with an in-memory canvas id would just resolve to null and
    // clobber canEdit (see above).
    if (!user || !supabaseConfigured || !activeCanvasId || localReadOnly) {
      setMembers([]);
      setAccessInfo(null);
      setCanvasInvites([]);
      setShareLink(null);
      return;
    }

    const supabase = createClient();
    const access = await fetchCanvasAccessInfo(
      supabase,
      activeCanvasId,
      user.id,
    );
    setAccessInfo(access);
    if (!access) {
      setMembers([]);
      return;
    }

    const ownerProfile = await fetchOwnerProfile(supabase, access.ownerId);
    if (!ownerProfile) return;

    const canvasMembers = await fetchCanvasMembers(
      supabase,
      activeCanvasId,
      access.ownerId,
      ownerProfile,
    );
    setMembers(canvasMembers);

    if (access.role === "owner") {
      const invites = await fetchCanvasInvitesForOwner(
        supabase,
        activeCanvasId,
      );
      setCanvasInvites(invites);
      const link = await getOrCreateShareLink(
        supabase,
        activeCanvasId,
        user.id,
      );
      setShareLink(link);
    } else {
      setCanvasInvites([]);
      setShareLink(null);
    }
  }, [activeCanvasId, localReadOnly, supabaseConfigured, user]);

  /**
   * Optimistically marks the caller as owner of a canvas they just created,
   * BEFORE `refreshActiveCanvasCollaboration`'s async round trip resolves.
   *
   * `createCanvas` always inserts with `owner_id: user.id` — the creator's
   * ownership is already a known fact at that point, not something that
   * needs a fetch to establish. Without this, `accessInfo` stays at its
   * `null` default (→ `canEdit` false) for the ~1 network round trip after
   * `activeCanvasId` flips to the new canvas, so the creator's OWN
   * brand-new canvas rendered read-only (disabled toolbar) until the fetch
   * caught up. The subsequent real fetch (triggered by the `activeCanvasId`
   * effect below) still runs and reconciles this to the same values.
   */
  const seedOwnerAccessInfo = useCallback(() => {
    if (!user) return;
    setAccessInfo({
      role: "owner",
      ownerId: user.id,
      allowViewerDuplicate: false,
    });
  }, [user]);

  useEffect(() => {
    void refreshSharedAndInvites();
  }, [refreshSharedAndInvites]);

  useEffect(() => {
    void refreshActiveCanvasCollaboration();
  }, [refreshActiveCanvasCollaboration]);

  useEffect(() => {
    const onCanvasSaved = () => {
      applyPendingRemoteSnapshot();
    };
    window.addEventListener("flowstate:canvas-saved", onCanvasSaved);
    return () =>
      window.removeEventListener("flowstate:canvas-saved", onCanvasSaved);
  }, [applyPendingRemoteSnapshot]);

  useEffect(() => {
    const onLocalEditsEnded = () => {
      applyPendingRemoteSnapshot();
    };
    window.addEventListener("flowstate:local-edits-ended", onLocalEditsEnded);
    return () =>
      window.removeEventListener("flowstate:local-edits-ended", onLocalEditsEnded);
  }, [applyPendingRemoteSnapshot]);

  useEffect(() => {
    const tearDownChannels = () => {
      void presenceChannelRef.current?.unsubscribe();
      void realtimeChannelRef.current?.unsubscribe();
      presenceChannelRef.current = null;
      realtimeChannelRef.current = null;
      setOnlineUserIds(new Set());
      setPresenceChannelReady(false);
      clearRemotePresence();
    };

    if (!user || !supabaseConfigured || !activeCanvasId || !accessInfo) {
      tearDownChannels();
      return;
    }

    // Eager cleanup before async setup — prevents listener buildup on rapid switches.
    tearDownChannels();

    let cancelled = false;
    let presenceChannel: RealtimeChannel | null = null;
    let realtimeChannel: RealtimeChannel | null = null;

    void (async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;

      if (session?.access_token) {
        supabase.realtime.setAuth(session.access_token);
      }

      if (cancelled) return;

      presenceChannel = supabase.channel(
        `canvas:${activeCanvasId}:presence`,
        {
          config: {
            private: true,
            presence: { key: user.id },
          },
        },
      );

      const syncRemotePresence = () => {
        const state =
          presenceChannel!.presenceState<CollaboratorPresence>();
        setRemotePresence(parsePresenceState(state, user.id));
        setOnlineUserIds(new Set(Object.keys(state)));
      };

      presenceChannel
        .on("presence", { event: "sync" }, syncRemotePresence)
        .on("presence", { event: "join" }, syncRemotePresence)
        .on("presence", { event: "leave" }, syncRemotePresence)
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED" && !cancelled) {
            setPresenceChannelReady(true);
            const name =
              user.user_metadata?.full_name ??
              user.user_metadata?.name ??
              user.email ??
              "User";
            const avatar = user.user_metadata?.avatar_url as string | undefined;
            await presenceChannel!.track({
              userId: user.id,
              displayName: name,
              avatarUrl: avatar,
              color: collaboratorColor(user.id),
              worldX: PRESENCE_OFF_SCREEN,
              worldY: PRESENCE_OFF_SCREEN,
              updatedAt: Date.now(),
            });
            syncRemotePresence();
          } else if (status !== "SUBSCRIBED") {
            setPresenceChannelReady(false);
          }
        });

      if (cancelled) {
        void presenceChannel.unsubscribe();
        return;
      }

      presenceChannelRef.current = presenceChannel;

      // Flag-gated op-log sync: collaborators' saves arrive as 1–5KB delta
      // batches on this channel and apply as idempotent LWW entity writes.
      // The postgres_changes snapshot path below remains the safety net —
      // ops give low latency, snapshots give eventual reconciliation.
      if (canvasOpsEnabled()) {
        setCanvasOpsChannel(presenceChannel);
        presenceChannel.on(
          "broadcast",
          { event: CANVAS_OPS_EVENT },
          ({ payload }: { payload: CanvasOpBatch }) => {
            const batch = payload;
            if (!batch?.batchId || !Array.isArray(batch.ops)) return;
            if (wasBatchSentLocally(batch.batchId)) return;
            if (batch.actorId === user.id) return;
            if (isHydratingRef?.current) return;
            // Mid-edit / mid-gesture: skip — the snapshot reconciliation
            // path already queues and applies once local edits settle.
            if (isDirtyRef?.current || hasActiveLocalEdits()) return;
            const state = useCanvasStore.getState();
            if (state.activeCanvasStrokeId) return;

            const applied = applyOps(pickCanvasPersistSlice(state), batch.ops);
            const baseSource = state.getCanvasSnapshotSource();
            // Slice fields are name-compatible with the snapshot source; the
            // slice types are intentionally loose (unknown records), so the
            // merge needs a cast. Skills aren't in the slice and keep their
            // local values — they sync via the snapshot safety net.
            const source = {
              ...baseSource,
              ...(applied as unknown as Partial<typeof baseSource>),
              // Viewport is per-user; ops never carry it.
              viewport: state.viewport,
            } as typeof baseSource;
            isRemoteUpdateRef.current = true;
            hydrateFromSnapshot(buildCanvasSnapshot(source), {
              applyViewport: false,
              preserveEphemeral: true,
            });
            requestAnimationFrame(() => {
              isRemoteUpdateRef.current = false;
            });
          },
        );
      }

      realtimeChannel = supabase
        .channel(`canvas:${activeCanvasId}:state`, { config: { private: true } })
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "canvases",
            filter: `id=eq.${activeCanvasId}`,
          },
          (payload) => {
            const row = payload.new as {
              state?: unknown;
              updated_at?: string;
            };
            const parsed = parseCanvasSnapshot(row.state);
            if (!parsed) return;

            considerRemoteSnapshot(parsed, row.updated_at);
          },
        )
        .subscribe();

      if (cancelled) {
        void realtimeChannel.unsubscribe();
        return;
      }

      realtimeChannelRef.current = realtimeChannel;
    })();

    return () => {
      cancelled = true;
      setCanvasOpsChannel(null);
      void presenceChannel?.unsubscribe();
      void realtimeChannel?.unsubscribe();
      presenceChannelRef.current = null;
      realtimeChannelRef.current = null;
      setOnlineUserIds(new Set());
      setPresenceChannelReady(false);
      clearRemotePresence();
    };
  }, [
    accessInfo,
    activeCanvasId,
    considerRemoteSnapshot,
    isHydratingRef,
    isRemoteUpdateRef,
    localReadOnly,
    supabaseConfigured,
    user,
  ]);

  const acceptInvite = useCallback(
    async (inviteId: string) => {
      if (localReadOnly) return;
      if (!user?.email) return;
      const supabase = createClient();
      const canvasId = await acceptCanvasInvite(
        supabase,
        inviteId,
        user.id,
        user.email,
      );
      await refreshSharedAndInvites();
      await onRefreshCanvasList();
      await onCanvasJoined(canvasId);
    },
    [localReadOnly, onCanvasJoined, onRefreshCanvasList, refreshSharedAndInvites, user],
  );

  const declineInvite = useCallback(
    async (inviteId: string) => {
      if (localReadOnly) return;
      const supabase = createClient();
      await declineCanvasInvite(supabase, inviteId);
      await refreshSharedAndInvites();
    },
    [localReadOnly, refreshSharedAndInvites],
  );

  const sendInvite = useCallback(
    async (email: string, role: CollaboratorRole) => {
      if (localReadOnly) return;
      if (!user || !activeCanvasId) return;
      const supabase = createClient();
      await inviteToCanvasByEmail(
        supabase,
        activeCanvasId,
        email,
        role,
        user.id,
      );
      await refreshActiveCanvasCollaboration();
    },
    [activeCanvasId, localReadOnly, refreshActiveCanvasCollaboration, user],
  );

  const removeMember = useCallback(
    async (userId: string) => {
      if (localReadOnly) return;
      if (!activeCanvasId) return;
      const supabase = createClient();
      await removeCanvasCollaborator(supabase, activeCanvasId, userId);
      await refreshActiveCanvasCollaboration();
    },
    [activeCanvasId, localReadOnly, refreshActiveCanvasCollaboration],
  );

  const changeMemberRole = useCallback(
    async (userId: string, role: CollaboratorRole) => {
      if (localReadOnly) return;
      if (!activeCanvasId) return;
      const supabase = createClient();
      await updateCollaboratorRole(supabase, activeCanvasId, userId, role);
      await refreshActiveCanvasCollaboration();
    },
    [activeCanvasId, localReadOnly, refreshActiveCanvasCollaboration],
  );

  const toggleAllowViewerDuplicate = useCallback(
    async (allow: boolean) => {
      if (localReadOnly) return;
      if (!activeCanvasId) return;
      const supabase = createClient();
      await setAllowViewerDuplicate(supabase, activeCanvasId, allow);
      setAccessInfo((prev) =>
        prev ? { ...prev, allowViewerDuplicate: allow } : prev,
      );
    },
    [activeCanvasId, localReadOnly],
  );

  const regenerateShareLink = useCallback(async () => {
    if (localReadOnly) return null;
    if (!user || !activeCanvasId) return null;
    const supabase = createClient();
    await revokeShareLink(supabase, activeCanvasId);
    const link = await getOrCreateShareLink(supabase, activeCanvasId, user.id);
    setShareLink(link);
    return link;
  }, [activeCanvasId, localReadOnly, user]);

  const leaveCanvas = useCallback(async () => {
    if (localReadOnly) return;
    if (!user || !activeCanvasId) return;
    const supabase = createClient();
    await leaveSharedCanvas(supabase, activeCanvasId, user.id);
    await refreshSharedAndInvites();
    await onRefreshCanvasList();
  }, [activeCanvasId, localReadOnly, onRefreshCanvasList, refreshSharedAndInvites, user]);

  const transferOwnership = useCallback(
    async (newOwnerId: string) => {
      if (localReadOnly) return;
      if (!user || !activeCanvasId) return;
      const supabase = createClient();
      await transferCanvasOwnership(
        supabase,
        activeCanvasId,
        user.id,
        newOwnerId,
      );
      await refreshActiveCanvasCollaboration();
      await onRefreshCanvasList();
    },
    [activeCanvasId, localReadOnly, onRefreshCanvasList, refreshActiveCanvasCollaboration, user],
  );

  const duplicateCanvasById = useCallback(
    async (canvasId: string) => {
      if (localReadOnly) return null;
      if (!user || !supabaseConfigured) return null;

      const supabase = createClient();
      const { data: canvas } = await supabase
        .from("canvases")
        .select("title, owner_id")
        .eq("id", canvasId)
        .maybeSingle();

      if (!canvas) return null;

      const isOwner = canvas.owner_id === user.id;
      if (!isOwner) {
        const access = await fetchCanvasAccessInfo(supabase, canvasId, user.id);
        const canDuplicateAsViewer =
          access?.role === "viewer" && access.allowViewerDuplicate;
        if (access?.role !== "editor" && !canDuplicateAsViewer) {
          return null;
        }
      }

      const title = buildDuplicateTitle(canvas.title ?? "Canvas");
      const created = await duplicateCanvasForUser(
        supabase,
        canvasId,
        user.id,
        title,
      );
      await onRefreshCanvasList();
      await refreshSharedAndInvites();
      return created.id;
    },
    [
      localReadOnly,
      onRefreshCanvasList,
      refreshSharedAndInvites,
      supabaseConfigured,
      user,
    ],
  );

  const duplicateActiveCanvas = useCallback(async () => {
    if (!activeCanvasId || !accessInfo) return null;
    return duplicateCanvasById(activeCanvasId);
  }, [accessInfo, activeCanvasId, duplicateCanvasById]);

  const joinViaToken = useCallback(
    async (token: string) => {
      if (localReadOnly) return null;
      if (!user) return null;
      const supabase = createClient();
      const canvasId = await joinCanvasViaShareLink(
        supabase,
        token,
        user.id,
      );
      if (!canvasId) return null;
      await refreshSharedAndInvites();
      await onRefreshCanvasList();
      await onCanvasJoined(canvasId);
      return canvasId;
    },
    [localReadOnly, onCanvasJoined, onRefreshCanvasList, refreshSharedAndInvites, user],
  );

  const stampContributor = useCallback(
    (userId: string, cardId?: string, artifactId?: string) => {
      if (!canEdit) return;
      const store = useCanvasStore.getState();
      store.setCollaborationHasEdits(true);
      if (cardId) store.appendContributorToCard(cardId, userId);
      if (artifactId) store.appendContributorToArtifact(artifactId, userId);
    },
    [canEdit],
  );

  return {
    sharedCanvases,
    pendingInvites,
    canvasInvites,
    members,
    accessInfo,
    activeCanvasRole,
    canEdit,
    shareLink,
    onlineUserIds,
    presenceChannelReady,
    collaborationHasEdits,
    presenceChannelRef,
    isRemoteUpdateRef,
    acceptInvite,
    declineInvite,
    sendInvite,
    removeMember,
    changeMemberRole,
    toggleAllowViewerDuplicate,
    regenerateShareLink,
    leaveCanvas,
    transferOwnership,
    duplicateActiveCanvas,
    duplicateCanvasById,
    ownedCanvasShareFlags,
    joinViaToken,
    refreshSharedAndInvites,
    refreshActiveCanvasCollaboration,
    seedOwnerAccessInfo,
    stampContributor,
    getSnapshotSource,
  };
}

export type CollaborationContextValue = ReturnType<typeof useCollaboration>;
