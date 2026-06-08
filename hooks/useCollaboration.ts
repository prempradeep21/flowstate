"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";
import {
  acceptCanvasInvite,
  canEditCanvas,
  declineCanvasInvite,
  duplicateCanvasForUser,
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
  CollaboratorRole,
  SharedCanvasMeta,
} from "@/lib/collaborationTypes";
import { collaboratorColor } from "@/lib/collaboratorColors";
import { parseCanvasSnapshot } from "@/lib/canvasSnapshot";
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
}: UseCollaborationOptions) {
  const [sharedCanvases, setSharedCanvases] = useState<SharedCanvasMeta[]>([]);
  const [pendingInvites, setPendingInvites] = useState<CanvasInvite[]>([]);
  const [canvasInvites, setCanvasInvites] = useState<CanvasInvite[]>([]);
  const [members, setMembers] = useState<CanvasMember[]>([]);
  const [accessInfo, setAccessInfo] = useState<CanvasAccessInfo | null>(null);
  const [shareLink, setShareLink] = useState<CanvasShareLink | null>(null);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [collaborationHasEdits, setCollaborationHasEdits] = useState(false);

  const presenceChannelRef = useRef<RealtimeChannel | null>(null);
  const realtimeChannelRef = useRef<RealtimeChannel | null>(null);

  const hydrateFromSnapshot = useCanvasStore((s) => s.hydrateFromSnapshot);
  const getSnapshotSource = useCanvasStore((s) => s.getCanvasSnapshotSource);

  const activeCanvasRole: CanvasRole | null = accessInfo?.role ?? null;
  const canEdit = canEditCanvas(activeCanvasRole);

  const refreshSharedAndInvites = useCallback(async () => {
    if (!user || !supabaseConfigured) {
      setSharedCanvases([]);
      setPendingInvites([]);
      return;
    }

    const supabase = createClient();
    await processPendingInvitesForEmail(
      supabase,
      user.id,
      user.email ?? "",
    );

    try {
      const [shared, pending] = await Promise.all([
        fetchSharedCanvasList(supabase, user.id),
        user.email
          ? fetchPendingInvitesForUser(supabase, user.email)
          : Promise.resolve([]),
      ]);

      setSharedCanvases(shared);
      setPendingInvites(pending);
    } catch (err) {
      console.warn("[collab] refresh shared canvases failed:", err);
      setSharedCanvases([]);
      setPendingInvites([]);
    }
  }, [supabaseConfigured, user]);

  const refreshActiveCanvasCollaboration = useCallback(async () => {
    if (!user || !supabaseConfigured || !activeCanvasId) {
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
  }, [activeCanvasId, supabaseConfigured, user]);

  useEffect(() => {
    void refreshSharedAndInvites();
  }, [refreshSharedAndInvites]);

  useEffect(() => {
    void refreshActiveCanvasCollaboration();
  }, [refreshActiveCanvasCollaboration]);

  useEffect(() => {
    const tearDownChannels = () => {
      void presenceChannelRef.current?.unsubscribe();
      void realtimeChannelRef.current?.unsubscribe();
      presenceChannelRef.current = null;
      realtimeChannelRef.current = null;
      setOnlineUserIds(new Set());
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

      presenceChannel
        .on("presence", { event: "sync" }, () => {
          const state = presenceChannel!.presenceState();
          const ids = new Set<string>(Object.keys(state));
          setOnlineUserIds(ids);
        })
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED" && !cancelled) {
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
              worldX: -99999,
              worldY: -99999,
              updatedAt: Date.now(),
            });
          }
        });

      if (cancelled) {
        void presenceChannel.unsubscribe();
        return;
      }

      presenceChannelRef.current = presenceChannel;

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
            if (localReadOnly) return;

            const newState = (payload.new as { state?: unknown })?.state;
            const parsed = parseCanvasSnapshot(newState);
            if (!parsed) return;

            if (isHydratingRef?.current || isDirtyRef?.current) return;

            const reveal = useCanvasStore.getState().canvasLoadReveal;
            if (
              reveal?.phase === "pending" ||
              reveal?.phase === "running"
            ) {
              return;
            }

            isRemoteUpdateRef.current = true;
            hydrateFromSnapshot(parsed, { applyViewport: false });
            requestAnimationFrame(() => {
              isRemoteUpdateRef.current = false;
            });
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
      void presenceChannel?.unsubscribe();
      void realtimeChannel?.unsubscribe();
      presenceChannelRef.current = null;
      realtimeChannelRef.current = null;
      setOnlineUserIds(new Set());
    };
  }, [
    accessInfo,
    activeCanvasId,
    hydrateFromSnapshot,
    isDirtyRef,
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

  const duplicateActiveCanvas = useCallback(async () => {
    if (localReadOnly) return null;
    if (!user || !activeCanvasId || !accessInfo) return null;
    const supabase = createClient();
    const { data: canvas } = await supabase
      .from("canvases")
      .select("title")
      .eq("id", activeCanvasId)
      .maybeSingle();
    const title = buildDuplicateTitle(canvas?.title ?? "Canvas");
    const created = await duplicateCanvasForUser(
      supabase,
      activeCanvasId,
      user.id,
      title,
    );
    await onRefreshCanvasList();
    return created.id;
  }, [accessInfo, activeCanvasId, localReadOnly, onRefreshCanvasList, user]);

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
    joinViaToken,
    refreshSharedAndInvites,
    refreshActiveCanvasCollaboration,
    stampContributor,
    getSnapshotSource,
  };
}

export type CollaborationContextValue = ReturnType<typeof useCollaboration>;
