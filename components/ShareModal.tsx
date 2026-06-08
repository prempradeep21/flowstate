"use client";

import { useCallback, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import {
  MotionBackdrop,
  MotionOverlayModal,
} from "@/components/motion/MotionOverlay";
import {
  MAX_CANVAS_MEMBERS,
  isCanvasOwner,
} from "@/lib/collaborationPersistence";
import type { CollaboratorRole } from "@/lib/collaborationTypes";

export function ShareModal() {
  const {
    shareModalOpen,
    setShareModalOpen,
    activeCanvasRole,
    members,
    canvasInvites,
    shareLink,
    accessInfo,
    sendInvite,
    removeMember,
    changeMemberRole,
    toggleAllowViewerDuplicate,
    regenerateShareLink,
    transferOwnership,
    leaveCanvas,
    duplicateActiveCanvas,
    switchCanvas,
    user,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<CollaboratorRole>("viewer");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const isOwner = isCanvasOwner(activeCanvasRole);
  const memberCount = members.length;
  const atCap = memberCount >= MAX_CANVAS_MEMBERS;

  const close = useCallback(() => {
    setShareModalOpen(false);
    setError(null);
    setEmail("");
  }, [setShareModalOpen]);

  const handleInvite = useCallback(async () => {
    if (!email.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await sendInvite(email, role);
      setEmail("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send invite");
    } finally {
      setBusy(false);
    }
  }, [email, role, sendInvite]);

  const copyLink = useCallback(async () => {
    if (!shareLink?.token) return;
    const url = `${window.location.origin}/canvas/join/${shareLink.token}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [shareLink?.token]);

  const handleDuplicate = useCallback(async () => {
    setBusy(true);
    try {
      const newId = await duplicateActiveCanvas();
      if (newId) {
        await switchCanvas(newId);
        close();
      }
    } finally {
      setBusy(false);
    }
  }, [close, duplicateActiveCanvas, switchCanvas]);

  const canDuplicate =
    activeCanvasRole === "editor" ||
    (activeCanvasRole === "viewer" && accessInfo?.allowViewerDuplicate);

  return (
    <>
      <MotionBackdrop
        isOpen={shareModalOpen}
        onClick={close}
        className="pointer-events-auto fixed inset-0 z-[100] bg-black/40"
      />
      {shareModalOpen && (
        <div className="pointer-events-none fixed inset-0 z-[101] flex items-center justify-center p-4">
          <MotionOverlayModal
            isOpen={shareModalOpen}
            className="pointer-events-auto max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl border border-canvas-border bg-canvas-card p-5 shadow-card"
          >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 id="share-modal-title" className="text-lg font-semibold text-canvas-ink">
            Share canvas
          </h2>
          <button
            type="button"
            onClick={close}
            className="rounded-lg p-1 text-canvas-muted hover:bg-canvas-bg hover:text-canvas-ink"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {isOwner && (
          <>
            <div className="mb-4 space-y-2">
              <label className="text-[13px] font-medium text-canvas-muted">
                Invite by email
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  disabled={atCap || busy}
                  className="min-w-0 flex-1 rounded-lg border border-canvas-border bg-canvas-bg px-3 py-2 text-[15px] text-canvas-ink outline-none focus:border-canvas-accent disabled:opacity-50"
                />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as CollaboratorRole)}
                  disabled={atCap || busy}
                  className="rounded-lg border border-canvas-border bg-canvas-bg px-2 py-2 text-[14px] text-canvas-ink"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                </select>
              </div>
              <button
                type="button"
                disabled={atCap || busy || !email.trim()}
                onClick={() => void handleInvite()}
                className="w-full rounded-lg bg-canvas-ink px-4 py-2 text-[14px] font-medium text-canvas-card transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {atCap ? "Collaborator limit reached (5)" : "Send invite"}
              </button>
              {error && (
                <p className="text-[13px] text-red-600">{error}</p>
              )}
            </div>

            {canvasInvites.length > 0 && (
              <div className="mb-4">
                <h3 className="mb-2 text-[13px] font-medium text-canvas-muted">
                  Pending invites
                </h3>
                <ul className="space-y-1">
                  {canvasInvites.map((inv) => (
                    <li
                      key={inv.id}
                      className="flex items-center justify-between rounded-lg bg-canvas-bg px-3 py-2 text-[14px]"
                    >
                      <span className="truncate text-canvas-ink">{inv.email}</span>
                      <span className="shrink-0 text-canvas-muted">{inv.role}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mb-4 space-y-2 border-t border-canvas-border pt-4">
              <h3 className="text-[13px] font-medium text-canvas-muted">
                View-only link
              </h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void copyLink()}
                  disabled={!shareLink?.token}
                  className="flex-1 rounded-lg border border-canvas-border px-3 py-2 text-[14px] font-medium text-canvas-ink hover:bg-canvas-bg disabled:opacity-40"
                >
                  {copied ? "Copied!" : "Copy link"}
                </button>
                <button
                  type="button"
                  onClick={() => void regenerateShareLink()}
                  disabled={busy}
                  className="rounded-lg border border-canvas-border px-3 py-2 text-[14px] text-canvas-muted hover:bg-canvas-bg"
                >
                  Regenerate
                </button>
              </div>
            </div>

            <label className="mb-4 flex cursor-pointer items-center gap-2 text-[14px] text-canvas-ink">
              <input
                type="checkbox"
                checked={accessInfo?.allowViewerDuplicate ?? false}
                onChange={(e) => void toggleAllowViewerDuplicate(e.target.checked)}
                className="rounded border-canvas-border"
              />
              Allow viewers to duplicate this canvas
            </label>
          </>
        )}

        <div className="mb-4 border-t border-canvas-border pt-4">
          <h3 className="mb-2 text-[13px] font-medium text-canvas-muted">
            People with access ({memberCount}/{MAX_CANVAS_MEMBERS})
          </h3>
          <ul className="space-y-2">
            {members.map((member) => (
              <li
                key={member.userId}
                className="flex items-center gap-2 rounded-lg bg-canvas-bg px-3 py-2"
              >
                {member.profile.avatarUrl ? (
                  <img
                    src={member.profile.avatarUrl}
                    alt=""
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-canvas-accent text-sm font-semibold text-white">
                    {(member.profile.displayName ?? "?").charAt(0).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium text-canvas-ink">
                    {member.profile.displayName ?? "User"}
                    {member.userId === user?.id ? " (you)" : ""}
                  </p>
                  <p className="text-[12px] capitalize text-canvas-muted">
                    {member.role}
                  </p>
                </div>
                {isOwner && member.role !== "owner" && (
                  <div className="flex shrink-0 gap-1">
                    <select
                      value={member.role}
                      onChange={(e) =>
                        void changeMemberRole(
                          member.userId,
                          e.target.value as CollaboratorRole,
                        )
                      }
                      className="rounded border border-canvas-border bg-canvas-card px-1 py-0.5 text-[12px]"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => void removeMember(member.userId)}
                      className="rounded px-2 py-0.5 text-[12px] text-red-600 hover:bg-red-50"
                    >
                      Remove
                    </button>
                    {member.role === "editor" && (
                      <button
                        type="button"
                        onClick={() => void transferOwnership(member.userId)}
                        className="rounded px-2 py-0.5 text-[12px] text-canvas-muted hover:bg-canvas-bg"
                        title="Transfer ownership"
                      >
                        Make owner
                      </button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-2 border-t border-canvas-border pt-4">
          {canDuplicate && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleDuplicate()}
              className="rounded-lg border border-canvas-border px-4 py-2 text-[14px] font-medium text-canvas-ink hover:bg-canvas-bg disabled:opacity-40"
            >
              Duplicate canvas
            </button>
          )}
          {!isOwner && activeCanvasRole && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void leaveCanvas()}
              className="rounded-lg border border-red-200 px-4 py-2 text-[14px] font-medium text-red-600 hover:bg-red-50 disabled:opacity-40"
            >
              Leave canvas
            </button>
          )}
        </div>
      </div>
          </MotionOverlayModal>
        </div>
      )}
    </>
  );
}
