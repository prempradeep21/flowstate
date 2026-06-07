export type CanvasRole = "owner" | "editor" | "viewer";
export type CollaboratorRole = "editor" | "viewer";
export type InviteStatus = "pending" | "accepted" | "declined";

export interface CollaboratorProfile {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface CanvasMember {
  userId: string;
  role: CanvasRole;
  invitedAt: string;
  profile: CollaboratorProfile;
}

export interface CanvasInvite {
  id: string;
  canvasId: string;
  canvasTitle: string;
  email: string;
  role: CollaboratorRole;
  status: InviteStatus;
  invitedBy: string;
  inviterName: string | null;
  inviterAvatarUrl: string | null;
  createdAt: string;
}

export interface CanvasShareLink {
  canvasId: string;
  token: string;
  revokedAt: string | null;
}

export interface SharedCanvasMeta {
  id: string;
  title: string;
  ownerId: string;
  role: CanvasRole;
  updatedAt: string;
  isShared: true;
}

export interface OwnedCanvasMeta {
  id: string;
  title: string;
  isDefault: boolean;
  updatedAt: string;
  isShared: false;
}

export type CanvasListMeta = OwnedCanvasMeta | SharedCanvasMeta;

export interface CollaboratorPresence {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  color: string;
  worldX: number;
  worldY: number;
  updatedAt: number;
}

export interface CanvasAccessInfo {
  role: CanvasRole;
  ownerId: string;
  allowViewerDuplicate: boolean;
}
