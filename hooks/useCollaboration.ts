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
  onCanvasJoined: (canvasId: string) => Promise<void>;
  onRefreshCanvasList: () => Promise<void>;
  isRemoteUpdateRef: React.MutableRefObject<boolean>;
}

export function useCollaboration({
  user,
  supabaseConfigured,
  activeCanvasId,
  onCanvasJoined,
  onRefreshCanvasList,
  isRemoteUpdateRef,
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

    const [shared, pending] = await Promise.all([
      fetchSharedCanvasList(supabase, user.id),
      user.email
        ? fetchPendingInvitesForUser(supabase, user.email)
        : Promise.resolve([]),
    ]);

    setSharedCanvases(shared);
    setPendingInvites(pending);
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
    if (!user || !supabaseConfigured || !activeCanvasId) return;

    const supabase = createClient();

    const presenceChannel = supabase.channel(
      `canvas:${activeCanvasId}:presence`,
      { config: { presence: { key: user.id } } },
    );

    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState();
        const ids = new Set<string>(Object.keys(state));
        setOnlineUserIds(ids);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          const name =
            user.user_metadata?.full_name ??
            user.user_metadata?.name ??
            user.email ??
            "User";
          const avatar = user.user_metadata?.avatar_url as string | undefined;
          await presenceChannel.track({
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

    presenceChannelRef.current = presenceChannel;

    const realtimeChannel = supabase
      .channel(`canvas:${activeCanvasId}:state`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "canvases",
          filter: `id=eq.${activeCanvasId}`,
        },
        (payload) => {
          const newState = (payload.new as { state?: unknown })?.state;
          const parsed = parseCanvasSnapshot(newState);
          if (!parsed) return;
          isRemoteUpdateRef.current = true;
          hydrateFromSnapshot(parsed);
          requestAnimationFrame(() => {
            isRemoteUpdateRef.current = false;
          });
        },
      )
      .subscribe();

    realtimeChannelRef.current = realtimeChannel;

    return () => {
      void presenceChannel.unsubscribe();
      void realtimeChannel.unsubscribe();
      presenceChannelRef.current = null;
      realtimeChannelRef.current = null;
      setOnlineUserIds(new Set());
    };
  }, [
    activeCanvasId,
    hydrateFromSnapshot,
    supabaseConfigured,
    user,
  ]);

  const acceptInvite = useCallback(
    async (inviteId: string) => {
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
    [onCanvasJoined, onRefreshCanvasList, refreshSharedAndInvites, user],
  );

  const declineInvite = useCallback(
    async (inviteId: string) => {
      const supabase = createClient();
      await declineCanvasInvite(supabase, inviteId);
      await refreshSharedAndInvites();
    },
    [refreshSharedAndInvites],
  );

  const sendInvite = useCallback(
    async (email: string, role: CollaboratorRole) => {
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
    [activeCanvasId, refreshActiveCanvasCollaboration, user],
  );

  const removeMember = useCallback(
    async (userId: string) => {
      if (!activeCanvasId) return;
      const supabase = createClient();
      await removeCanvasCollaborator(supabase, activeCanvasId, userId);
      await refreshActiveCanvasCollaboration();
    },
    [activeCanvasId, refreshActiveCanvasCollaboration],
  );

  const changeMemberRole = useCallback(
    async (userId: string, role: CollaboratorRole) => {
      if (!activeCanvasId) return;
      const supabase = createClient();
      await updateCollaboratorRole(supabase, activeCanvasId, userId, role);
      await refreshActiveCanvasCollaboration();
    },
    [activeCanvasId, refreshActiveCanvasCollaboration],
  );

  const toggleAllowViewerDuplicate = useCallback(
    async (allow: boolean) => {
      if (!activeCanvasId) return;
      const supabase = createClient();
      await setAllowViewerDuplicate(supabase, activeCanvasId, allow);
      setAccessInfo((prev) =>
        prev ? { ...prev, allowViewerDuplicate: allow } : prev,
      );
    },
    [activeCanvasId],
  );

  const regenerateShareLink = useCallback(async () => {
    if (!user || !activeCanvasId) return null;
    const supabase = createClient();
    await revokeShareLink(supabase, activeCanvasId);
    const link = await getOrCreateShareLink(supabase, activeCanvasId, user.id);
    setShareLink(link);
    return link;
  }, [activeCanvasId, user]);

  const leaveCanvas = useCallback(async () => {
    if (!user || !activeCanvasId) return;
    const supabase = createClient();
    await leaveSharedCanvas(supabase, activeCanvasId, user.id);
    await refreshSharedAndInvites();
    await onRefreshCanvasList();
  }, [activeCanvasId, onRefreshCanvasList, refreshSharedAndInvites, user]);

  const transferOwnership = useCallback(
    async (newOwnerId: string) => {
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
    [activeCanvasId, onRefreshCanvasList, refreshActiveCanvasCollaboration, user],
  );

  const duplicateActiveCanvas = useCallback(async () => {
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
  }, [accessInfo, activeCanvasId, onRefreshCanvasList, user]);

  const joinViaToken = useCallback(
    async (token: string) => {
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
    [onCanvasJoined, onRefreshCanvasList, refreshSharedAndInvites, user],
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
