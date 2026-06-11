"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { MotionPanelLine } from "@/components/motion/MotionPanelLine";
import { MotionFlowSize } from "@/components/motion/MotionFlowSize";
import { PersonIcon } from "@/components/MenuIcons";
import { CanvasRowMenu } from "@/components/sidebar/CanvasRowMenu";
import { DeleteCanvasConfirmModal } from "@/components/sidebar/DeleteCanvasConfirmModal";
import { LEFT_PANEL_SECTIONS } from "@/lib/motion/variants";
import type { SharedCanvasMeta } from "@/lib/collaborationTypes";

export function CanvasesSection({
  staggerActive = false,
}: {
  staggerActive?: boolean;
}) {
  const {
    user,
    supabaseConfigured,
    activeCanvasId,
    canvases,
    sharedCanvases,
    pendingInvites,
    isSwitchingCanvas,
    switchingCanvasId,
    switchCanvas,
    createNewCanvas,
    renameCanvas,
    deleteOwnedCanvas,
    duplicateCanvas,
    ownedCanvasShareFlags,
    acceptInvite,
    declineInvite,
  } = useAuth();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const canManage = Boolean(user && supabaseConfigured);

  const startRename = useCallback((canvasId: string, currentTitle: string) => {
    setEditingId(canvasId);
    setEditTitle(currentTitle);
  }, []);

  const cancelRename = useCallback(() => {
    setEditingId(null);
    setEditTitle("");
  }, []);

  const commitRename = useCallback(
    async (canvasId: string) => {
      const trimmed = editTitle.trim();
      if (!trimmed) {
        cancelRename();
        return;
      }
      const canvas = canvases.find((c) => c.id === canvasId);
      if (canvas && trimmed !== canvas.title) {
        await renameCanvas(canvasId, trimmed);
      }
      cancelRename();
    },
    [cancelRename, canvases, editTitle, renameCanvas],
  );

  useEffect(() => {
    if (editingId) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editingId]);

  const startDelete = useCallback(
    (canvasId: string, title: string) => {
      if (editingId === canvasId) cancelRename();
      setMenuOpenId(null);
      setDeleteError(null);
      setPendingDelete({ id: canvasId, title });
    },
    [cancelRename, editingId],
  );

  const cancelDelete = useCallback(() => {
    if (deleteBusy) return;
    setPendingDelete(null);
    setDeleteError(null);
  }, [deleteBusy]);

  const handleDuplicate = useCallback(
    async (canvasId: string) => {
      if (duplicatingId || isSwitchingCanvas) return;
      setMenuOpenId(null);
      setDuplicatingId(canvasId);
      try {
        const newId = await duplicateCanvas(canvasId);
        if (newId) {
          await switchCanvas(newId);
        }
      } finally {
        setDuplicatingId(null);
      }
    },
    [duplicateCanvas, duplicatingId, isSwitchingCanvas, switchCanvas],
  );

  const confirmDelete = useCallback(async () => {
    if (!pendingDelete || deleteBusy) return;

    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await deleteOwnedCanvas(pendingDelete.id);
      setPendingDelete(null);
    } catch {
      setDeleteError("Could not delete this canvas. Please try again.");
    } finally {
      setDeleteBusy(false);
    }
  }, [deleteBusy, deleteOwnedCanvas, pendingDelete]);

  return (
    <MotionFlowSize
      as="section"
      className="border-b border-canvas-border px-3 py-3"
    >
      <MotionPanelLine
        section={LEFT_PANEL_SECTIONS.canvases}
        item={0}
        staggerActive={staggerActive}
        className="mb-2 flex items-center justify-between gap-2"
      >
        <h2 className="text-canvas-body-sm font-medium uppercase tracking-wide text-canvas-muted">
          Canvases
        </h2>
      </MotionPanelLine>

      <MotionPanelLine
        section={LEFT_PANEL_SECTIONS.canvases}
        item={1}
        staggerActive={staggerActive}
        className="mb-3"
      >
        {canManage ? (
          <button
            type="button"
            disabled={isSwitchingCanvas}
            onClick={() => void createNewCanvas()}
            className="flex w-full items-center justify-center gap-2 rounded-canvas border border-canvas-border bg-canvas-bg px-3 py-2.5 text-canvas-body-lg font-medium text-canvas-ink transition-colors hover:bg-canvas-card disabled:opacity-50"
          >
            <PlusIcon />
            Create New Canvas
          </button>
        ) : (
          <p className="text-canvas-body-lg leading-snug text-canvas-muted">
            Sign in to create and switch between canvases.
          </p>
        )}
      </MotionPanelLine>

      {pendingInvites.length > 0 && (
        <MotionFlowSize className="mb-3">
          <MotionPanelLine
            section={LEFT_PANEL_SECTIONS.invitations}
            item={0}
            staggerActive={staggerActive}
            className="mb-1.5"
          >
            <h3 className="text-canvas-compact font-medium uppercase tracking-wide text-canvas-muted">
              Invitations
            </h3>
          </MotionPanelLine>
          <ul className="space-y-1">
            {pendingInvites.map((invite, index) => (
              <MotionPanelLine
                key={invite.id}
                as="li"
                section={LEFT_PANEL_SECTIONS.invitations}
                item={index + 1}
                staggerActive={staggerActive}
                className="rounded-canvas border border-canvas-border bg-canvas-bg px-2 py-2"
              >
                <div className="flex items-start gap-2">
                  {invite.inviterAvatarUrl ? (
                    <img
                      src={invite.inviterAvatarUrl}
                      alt=""
                      className="mt-0.5 h-7 w-7 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-canvas-accent text-canvas-compact font-semibold text-white">
                      {(invite.inviterName ?? "?").charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-canvas-body font-medium text-canvas-ink">
                      {invite.canvasTitle}
                    </p>
                    <p className="text-canvas-compact text-canvas-muted">
                      From {invite.inviterName ?? "someone"} · {invite.role}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => void acceptInvite(invite.id)}
                        className="rounded-canvas bg-canvas-ink px-2.5 py-1 text-canvas-compact font-medium text-canvas-card"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => void declineInvite(invite.id)}
                        className="rounded-canvas border border-canvas-border px-2.5 py-1 text-canvas-compact text-canvas-muted"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              </MotionPanelLine>
            ))}
          </ul>
        </MotionFlowSize>
      )}

      <MotionFlowSize as="ul" className="space-y-1">
        {canManage ? (
          canvases.map((canvas, index) => (
            <MotionPanelLine
              key={canvas.id}
              as="li"
              section={LEFT_PANEL_SECTIONS.myCanvases}
              item={index}
              staggerActive={staggerActive}
            >
              <CanvasListRow
                canvasId={canvas.id}
                title={canvas.title}
                active={canvas.id === activeCanvasId}
                isSharedWithMe={false}
                isSharedWithOthers={Boolean(ownedCanvasShareFlags[canvas.id])}
                isSwitching={isSwitchingCanvas}
                isPendingSwitch={switchingCanvasId === canvas.id}
                isDuplicating={duplicatingId === canvas.id}
                isEditing={editingId === canvas.id}
                menuOpen={menuOpenId === canvas.id}
                editTitle={editTitle}
                inputRef={inputRef}
                canRename={true}
                onSwitch={() => void switchCanvas(canvas.id)}
                onStartRename={() => startRename(canvas.id, canvas.title)}
                onDuplicate={() => void handleDuplicate(canvas.id)}
                onStartDelete={() => startDelete(canvas.id, canvas.title)}
                onEditTitleChange={setEditTitle}
                onCommitRename={() => void commitRename(canvas.id)}
                onCancelRename={cancelRename}
                onMenuOpenChange={(open) =>
                  setMenuOpenId(open ? canvas.id : null)
                }
              />
            </MotionPanelLine>
          ))
        ) : (
          <MotionPanelLine
            as="li"
            section={LEFT_PANEL_SECTIONS.myCanvases}
            item={0}
            staggerActive={staggerActive}
            className="rounded-canvas px-2 py-2 text-canvas-body-sm text-canvas-muted"
          >
            Local canvas
          </MotionPanelLine>
        )}
      </MotionFlowSize>

      {sharedCanvases.length > 0 && (
        <MotionFlowSize className="mt-3">
          <MotionPanelLine
            section={LEFT_PANEL_SECTIONS.shared}
            item={0}
            staggerActive={staggerActive}
            className="mb-1.5"
          >
            <h3 className="text-canvas-compact font-medium uppercase tracking-wide text-canvas-muted">
              Shared with me
            </h3>
          </MotionPanelLine>
          <ul className="space-y-1">
            {sharedCanvases.map((canvas: SharedCanvasMeta, index) => (
              <MotionPanelLine
                key={canvas.id}
                as="li"
                section={LEFT_PANEL_SECTIONS.shared}
                item={index + 1}
                staggerActive={staggerActive}
              >
                <CanvasListRow
                  canvasId={canvas.id}
                  title={canvas.title}
                  active={canvas.id === activeCanvasId}
                  isSharedWithMe={true}
                  isSharedWithOthers={false}
                  isSwitching={isSwitchingCanvas}
                  isPendingSwitch={switchingCanvasId === canvas.id}
                  isDuplicating={false}
                  isEditing={false}
                  menuOpen={false}
                  editTitle=""
                  inputRef={inputRef}
                  canRename={false}
                  onSwitch={() => void switchCanvas(canvas.id)}
                  onStartRename={() => {}}
                  onDuplicate={() => {}}
                  onStartDelete={() => {}}
                  onEditTitleChange={() => {}}
                  onCommitRename={() => {}}
                  onCancelRename={() => {}}
                  onMenuOpenChange={() => {}}
                />
              </MotionPanelLine>
            ))}
          </ul>
        </MotionFlowSize>
      )}

      <DeleteCanvasConfirmModal
        isOpen={pendingDelete !== null}
        canvasTitle={pendingDelete?.title ?? ""}
        busy={deleteBusy}
        error={deleteError}
        onConfirm={() => void confirmDelete()}
        onCancel={cancelDelete}
      />
    </MotionFlowSize>
  );
}

function CanvasListRow({
  canvasId,
  title,
  active,
  isSharedWithMe,
  isSharedWithOthers,
  isSwitching,
  isPendingSwitch,
  isDuplicating,
  isEditing,
  menuOpen,
  editTitle,
  inputRef,
  canRename,
  onSwitch,
  onStartRename,
  onDuplicate,
  onStartDelete,
  onEditTitleChange,
  onCommitRename,
  onCancelRename,
  onMenuOpenChange,
}: {
  canvasId: string;
  title: string;
  active: boolean;
  isSharedWithMe: boolean;
  isSharedWithOthers: boolean;
  isSwitching: boolean;
  isPendingSwitch?: boolean;
  isDuplicating?: boolean;
  isEditing: boolean;
  menuOpen: boolean;
  editTitle: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  canRename: boolean;
  onSwitch: () => void;
  onStartRename: () => void;
  onDuplicate: () => void;
  onStartDelete: () => void;
  onEditTitleChange: (v: string) => void;
  onCommitRename: () => void;
  onCancelRename: () => void;
  onMenuOpenChange: (open: boolean) => void;
}) {
  return (
    <div
      className={[
        "flex w-full items-center gap-1 rounded-canvas px-2 py-2 transition-colors",
        active ? "bg-canvas-bg" : "hover:bg-canvas-bg/70",
        isSwitching ? "opacity-70" : "",
      ].join(" ")}
    >
      <span
        className={[
          "h-2 w-2 shrink-0 rounded-full",
          active ? "bg-canvas-accent" : "bg-canvas-border",
        ].join(" ")}
        aria-hidden
      />
      {(isPendingSwitch || isDuplicating) && (
        <span
          className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-canvas-border border-t-canvas-accent"
          aria-label={isDuplicating ? "Duplicating canvas" : "Opening canvas"}
        />
      )}
      {isSharedWithMe && <SharedWithMeIcon />}
      {isEditing ? (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          value={editTitle}
          onChange={(e) => onEditTitleChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onCommitRename();
            } else if (e.key === "Escape") {
              e.preventDefault();
              onCancelRename();
            }
          }}
          onBlur={onCommitRename}
          className="min-w-0 flex-1 rounded border border-canvas-border bg-canvas-card px-2 py-0.5 text-canvas-body-sm text-canvas-ink outline-none focus:border-canvas-accent"
          aria-label="Canvas title"
        />
      ) : (
        <button
          type="button"
          disabled={isSwitching || active || menuOpen}
          onClick={onSwitch}
          className={[
            "min-w-0 flex-1 truncate text-left text-canvas-body-sm disabled:cursor-default",
            active ? "font-medium text-canvas-ink" : "text-canvas-ink",
          ].join(" ")}
        >
          {title}
        </button>
      )}
      {canRename && !isEditing && (
        <>
          {isSharedWithOthers && (
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center text-canvas-muted"
              title="Shared with others"
            >
              <PersonIcon />
            </span>
          )}
          <CanvasRowMenu
            onRename={onStartRename}
            onDuplicate={onDuplicate}
            onDelete={onStartDelete}
            disabled={isSwitching || Boolean(isDuplicating)}
            onOpenChange={onMenuOpenChange}
          />
        </>
      )}
    </div>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M8 3v10M3 8h10" strokeLinecap="round" />
    </svg>
  );
}

function SharedWithMeIcon() {
  return (
    <span
      className="flex h-7 w-7 shrink-0 items-center justify-center text-canvas-muted"
      title="Shared with you"
    >
      <PersonIcon />
    </span>
  );
}

