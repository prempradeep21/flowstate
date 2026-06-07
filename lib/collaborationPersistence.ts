import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type {
  CanvasAccessInfo,
  CanvasInvite,
  CanvasMember,
  CanvasRole,
  CanvasShareLink,
  CollaboratorProfile,
  CollaboratorRole,
  SharedCanvasMeta,
} from "@/lib/collaborationTypes";
import {
  fetchCanvasById,
  type CanvasRow,
} from "@/lib/canvasPersistence";
import {
  buildCanvasSnapshot,
  buildEmptyCanvasSnapshot,
  parseCanvasSnapshot,
  type CanvasSnapshot,
} from "@/lib/canvasSnapshot";
import type { CanvasSnapshotSource } from "@/lib/canvasSnapshot";

type Supabase = SupabaseClient<Database>;

export const MAX_CANVAS_MEMBERS = 5;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function mapProfile(row: {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}): CollaboratorProfile {
  return {
    id: row.id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
  };
}

export async function fetchSharedCanvasList(
  supabase: Supabase,
  userId: string,
): Promise<SharedCanvasMeta[]> {
  const { data, error } = await supabase
    .from("canvas_collaborators")
    .select("role, canvas_id")
    .eq("user_id", userId);

  if (error) throw error;
  if (!data?.length) return [];

  const canvasIds = data.map((r) => r.canvas_id);
  const { data: canvases, error: canvasError } = await supabase
    .from("canvases")
    .select("id, title, owner_id, updated_at")
    .in("id", canvasIds);

  if (canvasError) throw canvasError;

  const canvasById = new Map((canvases ?? []).map((c) => [c.id, c]));

  return data
    .map((row) => {
      const canvas = canvasById.get(row.canvas_id);
      if (!canvas) return null;
      return {
        id: canvas.id,
        title: canvas.title,
        ownerId: canvas.owner_id,
        role: row.role as CanvasRole,
        updatedAt: canvas.updated_at,
        isShared: true as const,
      };
    })
    .filter((item): item is SharedCanvasMeta => item !== null);
}

export async function fetchPendingInvitesForUser(
  supabase: Supabase,
  email: string,
): Promise<CanvasInvite[]> {
  const normalized = normalizeEmail(email);
  const { data, error } = await supabase
    .from("canvas_invites")
    .select("id, canvas_id, email, role, status, invited_by, created_at")
    .eq("status", "pending")
    .ilike("email", normalized);

  if (error) throw error;
  if (!data?.length) return [];

  const canvasIds = [...new Set(data.map((r) => r.canvas_id))];
  const inviterIds = [...new Set(data.map((r) => r.invited_by))];

  const [{ data: canvases }, { data: profiles }] = await Promise.all([
    supabase.from("canvases").select("id, title").in("id", canvasIds),
    supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", inviterIds),
  ]);

  const titleById = new Map((canvases ?? []).map((c) => [c.id, c.title]));
  const profileById = new Map(
    (profiles ?? []).map((p) => [p.id, mapProfile(p)]),
  );

  return data.map((row) => {
    const inviter = profileById.get(row.invited_by);
    return {
      id: row.id,
      canvasId: row.canvas_id,
      canvasTitle: titleById.get(row.canvas_id) ?? "Canvas",
      email: row.email,
      role: row.role as CollaboratorRole,
      status: row.status as "pending",
      invitedBy: row.invited_by,
      inviterName: inviter?.displayName ?? null,
      inviterAvatarUrl: inviter?.avatarUrl ?? null,
      createdAt: row.created_at,
    };
  });
}

export async function fetchCanvasInvitesForOwner(
  supabase: Supabase,
  canvasId: string,
): Promise<CanvasInvite[]> {
  const { data, error } = await supabase
    .from("canvas_invites")
    .select("id, canvas_id, email, role, status, invited_by, created_at")
    .eq("canvas_id", canvasId)
    .eq("status", "pending");

  if (error) throw error;
  if (!data?.length) return [];

  const { data: canvas } = await supabase
    .from("canvases")
    .select("title")
    .eq("id", canvasId)
    .maybeSingle();

  const inviterIds = [...new Set(data.map((r) => r.invited_by))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .in("id", inviterIds);

  const profileById = new Map(
    (profiles ?? []).map((p) => [p.id, mapProfile(p)]),
  );

  return data.map((row) => {
    const inviter = profileById.get(row.invited_by);
    return {
      id: row.id,
      canvasId: row.canvas_id,
      canvasTitle: canvas?.title ?? "Canvas",
      email: row.email,
      role: row.role as CollaboratorRole,
      status: row.status as "pending",
      invitedBy: row.invited_by,
      inviterName: inviter?.displayName ?? null,
      inviterAvatarUrl: inviter?.avatarUrl ?? null,
      createdAt: row.created_at,
    };
  });
}

export async function fetchCanvasMembers(
  supabase: Supabase,
  canvasId: string,
  ownerId: string,
  ownerProfile: CollaboratorProfile,
): Promise<CanvasMember[]> {
  const { data, error } = await supabase
    .from("canvas_collaborators")
    .select("user_id, role, invited_at")
    .eq("canvas_id", canvasId);

  if (error) throw error;

  const userIds = (data ?? []).map((row) => row.user_id);
  const { data: profiles } =
    userIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, display_name, avatar_url")
          .in("id", userIds)
      : { data: [] as { id: string; display_name: string | null; avatar_url: string | null }[] };

  const profileById = new Map(
    (profiles ?? []).map((p) => [p.id, mapProfile(p)]),
  );

  const collaborators: CanvasMember[] = (data ?? []).map((row) => ({
    userId: row.user_id,
    role: row.role as CanvasRole,
    invitedAt: row.invited_at,
    profile: profileById.get(row.user_id) ?? {
      id: row.user_id,
      displayName: null,
      avatarUrl: null,
    },
  }));

  return [
    {
      userId: ownerId,
      role: "owner",
      invitedAt: "",
      profile: ownerProfile,
    },
    ...collaborators,
  ];
}

export async function fetchCanvasAccessInfo(
  supabase: Supabase,
  canvasId: string,
  userId: string,
): Promise<CanvasAccessInfo | null> {
  const { data, error } = await supabase
    .from("canvases")
    .select("owner_id, allow_viewer_duplicate")
    .eq("id", canvasId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  if (data.owner_id === userId) {
    return {
      role: "owner",
      ownerId: data.owner_id,
      allowViewerDuplicate: data.allow_viewer_duplicate,
    };
  }

  const { data: collab, error: collabError } = await supabase
    .from("canvas_collaborators")
    .select("role")
    .eq("canvas_id", canvasId)
    .eq("user_id", userId)
    .maybeSingle();

  if (collabError) throw collabError;
  if (!collab) return null;

  return {
    role: collab.role as CanvasRole,
    ownerId: data.owner_id,
    allowViewerDuplicate: data.allow_viewer_duplicate,
  };
}

export async function fetchOwnerProfile(
  supabase: Supabase,
  ownerId: string,
): Promise<CollaboratorProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .eq("id", ownerId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapProfile(data);
}

export async function inviteToCanvasByEmail(
  supabase: Supabase,
  canvasId: string,
  email: string,
  role: CollaboratorRole,
  invitedBy: string,
): Promise<void> {
  const normalized = normalizeEmail(email);
  const { error } = await supabase.from("canvas_invites").upsert(
    {
      canvas_id: canvasId,
      email: normalized,
      role,
      invited_by: invitedBy,
      status: "pending",
    },
    { onConflict: "canvas_id,email" },
  );

  if (error) throw error;
}

export async function acceptCanvasInvite(
  supabase: Supabase,
  inviteId: string,
  userId: string,
  userEmail: string,
): Promise<string> {
  const { data: invite, error } = await supabase
    .from("canvas_invites")
    .select("id, canvas_id, email, role, status")
    .eq("id", inviteId)
    .maybeSingle();

  if (error) throw error;
  if (!invite || invite.status !== "pending") {
    throw new Error("Invite not found");
  }
  if (normalizeEmail(invite.email) !== normalizeEmail(userEmail)) {
    throw new Error("Invite email does not match your account");
  }

  const { error: collabError } = await supabase
    .from("canvas_collaborators")
    .upsert(
      {
        canvas_id: invite.canvas_id,
        user_id: userId,
        role: invite.role,
      },
      { onConflict: "canvas_id,user_id" },
    );

  if (collabError) throw collabError;

  const { error: updateError } = await supabase
    .from("canvas_invites")
    .update({ status: "accepted" })
    .eq("id", inviteId);

  if (updateError) throw updateError;

  return invite.canvas_id;
}

export async function declineCanvasInvite(
  supabase: Supabase,
  inviteId: string,
): Promise<void> {
  const { error } = await supabase
    .from("canvas_invites")
    .update({ status: "declined" })
    .eq("id", inviteId);

  if (error) throw error;
}

export async function removeCanvasCollaborator(
  supabase: Supabase,
  canvasId: string,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from("canvas_collaborators")
    .delete()
    .eq("canvas_id", canvasId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function updateCollaboratorRole(
  supabase: Supabase,
  canvasId: string,
  userId: string,
  role: CollaboratorRole,
): Promise<void> {
  const { error } = await supabase
    .from("canvas_collaborators")
    .update({ role })
    .eq("canvas_id", canvasId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function leaveSharedCanvas(
  supabase: Supabase,
  canvasId: string,
  userId: string,
): Promise<void> {
  await removeCanvasCollaborator(supabase, canvasId, userId);
}

export async function transferCanvasOwnership(
  supabase: Supabase,
  canvasId: string,
  currentOwnerId: string,
  newOwnerId: string,
): Promise<void> {
  const { error: updateError } = await supabase
    .from("canvases")
    .update({ owner_id: newOwnerId })
    .eq("id", canvasId)
    .eq("owner_id", currentOwnerId);

  if (updateError) throw updateError;

  await supabase
    .from("canvas_collaborators")
    .delete()
    .eq("canvas_id", canvasId)
    .eq("user_id", newOwnerId);

  const { error: demoteError } = await supabase
    .from("canvas_collaborators")
    .upsert(
      {
        canvas_id: canvasId,
        user_id: currentOwnerId,
        role: "editor",
      },
      { onConflict: "canvas_id,user_id" },
    );

  if (demoteError) throw demoteError;
}

export async function setAllowViewerDuplicate(
  supabase: Supabase,
  canvasId: string,
  allow: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("canvases")
    .update({ allow_viewer_duplicate: allow })
    .eq("id", canvasId);

  if (error) throw error;
}

export async function getOrCreateShareLink(
  supabase: Supabase,
  canvasId: string,
  createdBy: string,
): Promise<CanvasShareLink> {
  const { data: existing, error: fetchError } = await supabase
    .from("canvas_share_links")
    .select("canvas_id, token, revoked_at")
    .eq("canvas_id", canvasId)
    .maybeSingle();

  if (fetchError) throw fetchError;

  if (existing && !existing.revoked_at) {
    return {
      canvasId: existing.canvas_id,
      token: existing.token,
      revokedAt: existing.revoked_at,
    };
  }

  const { data, error } = await supabase
    .from("canvas_share_links")
    .upsert(
      {
        canvas_id: canvasId,
        created_by: createdBy,
        revoked_at: null,
        token: undefined,
      },
      { onConflict: "canvas_id" },
    )
    .select("canvas_id, token, revoked_at")
    .single();

  if (error) throw error;

  return {
    canvasId: data.canvas_id,
    token: data.token,
    revokedAt: data.revoked_at,
  };
}

export async function revokeShareLink(
  supabase: Supabase,
  canvasId: string,
): Promise<void> {
  const { error } = await supabase
    .from("canvas_share_links")
    .update({ revoked_at: new Date().toISOString() })
    .eq("canvas_id", canvasId);

  if (error) throw error;
}

export async function joinCanvasViaShareLink(
  supabase: Supabase,
  token: string,
  userId: string,
): Promise<string | null> {
  const { data, error } = await supabase.rpc("join_canvas_via_share_token", {
    p_token: token,
  });

  if (error) throw error;
  if (!data) return null;

  const access = await fetchCanvasAccessInfo(supabase, data, userId);
  return access ? data : null;
}

export async function duplicateCanvasForUser(
  supabase: Supabase,
  sourceCanvasId: string,
  userId: string,
  title: string,
): Promise<CanvasRow> {
  const source = await fetchCanvasById(supabase, sourceCanvasId);
  if (!source) throw new Error("Canvas not found");

  const snapshot = source.state;

  const { data, error } = await supabase
    .from("canvases")
    .insert({
      owner_id: userId,
      title,
      state: snapshot as unknown as Database["public"]["Tables"]["canvases"]["Insert"]["state"],
      is_default: false,
    })
    .select("id, state")
    .single();

  if (error) throw error;

  const parsed = parseCanvasSnapshot(data.state) ?? snapshot;
  return { id: data.id, state: parsed };
}

export async function deleteCanvas(
  supabase: Supabase,
  canvasId: string,
): Promise<void> {
  const { error } = await supabase.from("canvases").delete().eq("id", canvasId);
  if (error) throw error;
}

export async function processPendingInvitesForEmail(
  supabase: Supabase,
  userId: string,
  email: string,
): Promise<void> {
  const normalized = normalizeEmail(email);
  const { data: invites, error } = await supabase
    .from("canvas_invites")
    .select("id, canvas_id, role")
    .eq("status", "pending")
    .ilike("email", normalized);

  if (error) throw error;
  if (!invites?.length) return;

  for (const invite of invites) {
    await supabase.from("canvas_collaborators").upsert(
      {
        canvas_id: invite.canvas_id,
        user_id: userId,
        role: invite.role,
      },
      { onConflict: "canvas_id,user_id" },
    );
    await supabase
      .from("canvas_invites")
      .update({ status: "accepted" })
      .eq("id", invite.id);
  }
}

export function canEditCanvas(role: CanvasRole | null): boolean {
  return role === "owner" || role === "editor";
}

export function isCanvasOwner(role: CanvasRole | null): boolean {
  return role === "owner";
}

export function buildDuplicateTitle(title: string): string {
  return `${title} (copy)`;
}

export function snapshotWithOwnerAttribution(
  snapshot: CanvasSnapshot,
  ownerId: string,
): CanvasSnapshot {
  const cards = { ...snapshot.cards };
  for (const [id, card] of Object.entries(cards)) {
    if (!card.contributorIds?.length) {
      cards[id] = { ...card, contributorIds: [ownerId] };
    }
  }
  const sessionArtifacts = { ...snapshot.sessionArtifacts };
  for (const [id, artifact] of Object.entries(sessionArtifacts)) {
    const versions = artifact.versions.map((v) =>
      v.createdByUserId ? v : { ...v, createdByUserId: ownerId },
    );
    sessionArtifacts[id] = { ...artifact, versions };
  }
  return { ...snapshot, cards, sessionArtifacts };
}

export async function createCanvasWithSnapshot(
  supabase: Supabase,
  userId: string,
  title: string,
  source?: CanvasSnapshotSource,
): Promise<CanvasRow> {
  const snapshot = source
    ? buildCanvasSnapshot(source)
    : buildEmptyCanvasSnapshot();

  const { data, error } = await supabase
    .from("canvases")
    .insert({
      owner_id: userId,
      title,
      state: snapshot as unknown as Database["public"]["Tables"]["canvases"]["Insert"]["state"],
      is_default: false,
    })
    .select("id, state")
    .single();

  if (error) throw error;

  const parsed = parseCanvasSnapshot(data.state) ?? snapshot;
  return { id: data.id, state: parsed };
}
