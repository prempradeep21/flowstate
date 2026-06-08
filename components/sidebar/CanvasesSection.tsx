"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { CanvasRowMenu } from "@/components/sidebar/CanvasRowMenu";
import type { SharedCanvasMeta } from "@/lib/collaborationTypes";

export function CanvasesSection() {
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
    acceptInvite,
    declineInvite,
  } = useAuth();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
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

  return (
    <section className="border-b border-canvas-border px-3 py-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-[13px] font-medium uppercase tracking-wide text-canvas-muted">
          Canvases
        </h2>
      </div>

      {canManage ? (
        <button
          type="button"
          disabled={isSwitchingCanvas}
          onClick={() => void createNewCanvas()}
          className="mb-3 flex w-full items-center justify-center gap-2 rounded-lg border border-canvas-border bg-canvas-bg px-3 py-2.5 text-[16px] font-medium text-canvas-ink transition-colors hover:bg-canvas-card disabled:opacity-50"
        >
          <PlusIcon />
          Create New Canvas
        </button>
      ) : (
        <p className="mb-3 text-[15px] leading-snug text-canvas-muted">
          Sign in to create and switch between canvases.
        </p>
      )}

      {pendingInvites.length > 0 && (
        <div className="mb-3">
          <h3 className="mb-1.5 text-[12px] font-medium uppercase tracking-wide text-canvas-muted">
            Invitations
          </h3>
          <ul className="space-y-1">
            {pendingInvites.map((invite) => (
              <li
                key={invite.id}
                className="rounded-lg border border-canvas-border bg-canvas-bg px-2 py-2"
              >
                <div className="flex items-start gap-2">
                  {invite.inviterAvatarUrl ? (
                    <img
                      src={invite.inviterAvatarUrl}
                      alt=""
                      className="mt-0.5 h-7 w-7 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-canvas-accent text-xs font-semibold text-white">
                      {(invite.inviterName ?? "?").charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium text-canvas-ink">
                      {invite.canvasTitle}
                    </p>
                    <p className="text-[12px] text-canvas-muted">
                      From {invite.inviterName ?? "someone"} · {invite.role}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => void acceptInvite(invite.id)}
                        className="rounded-md bg-canvas-ink px-2.5 py-1 text-[12px] font-medium text-canvas-card"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => void declineInvite(invite.id)}
                        className="rounded-md border border-canvas-border px-2.5 py-1 text-[12px] text-canvas-muted"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ul className="space-y-1">
        {canManage ? (
          canvases.map((canvas) => (
            <CanvasListRow
              key={canvas.id}
              canvasId={canvas.id}
              title={canvas.title}
              active={canvas.id === activeCanvasId}
              isShared={false}
              isSwitching={isSwitchingCanvas}
              isPendingSwitch={switchingCanvasId === canvas.id}
              isEditing={editingId === canvas.id}
              menuOpen={menuOpenId === canvas.id}
              editTitle={editTitle}
              inputRef={inputRef}
              canRename={true}
              onSwitch={() => void switchCanvas(canvas.id)}
              onStartRename={() => startRename(canvas.id, canvas.title)}
              onEditTitleChange={setEditTitle}
              onCommitRename={() => void commitRename(canvas.id)}
              onCancelRename={cancelRename}
              onMenuOpenChange={(open) =>
                setMenuOpenId(open ? canvas.id : null)
              }
            />
          ))
        ) : (
          <li className="rounded-lg px-2 py-2 text-[17px] text-canvas-muted">
            Local canvas
          </li>
        )}
      </ul>

      {sharedCanvases.length > 0 && (
        <div className="mt-3">
          <h3 className="mb-1.5 text-[12px] font-medium uppercase tracking-wide text-canvas-muted">
            Shared with me
          </h3>
          <ul className="space-y-1">
            {sharedCanvases.map((canvas: SharedCanvasMeta) => (
              <CanvasListRow
                key={canvas.id}
                canvasId={canvas.id}
                title={canvas.title}
                active={canvas.id === activeCanvasId}
                isShared={true}
                isSwitching={isSwitchingCanvas}
              isPendingSwitch={switchingCanvasId === canvas.id}
                isEditing={false}
                menuOpen={false}
                editTitle=""
                inputRef={inputRef}
                canRename={false}
                onSwitch={() => void switchCanvas(canvas.id)}
                onStartRename={() => {}}
                onEditTitleChange={() => {}}
                onCommitRename={() => {}}
                onCancelRename={() => {}}
                onMenuOpenChange={() => {}}
              />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function CanvasListRow({
  canvasId,
  title,
  active,
  isShared,
  isSwitching,
  isPendingSwitch,
  isEditing,
  menuOpen,
  editTitle,
  inputRef,
  canRename,
  onSwitch,
  onStartRename,
  onEditTitleChange,
  onCommitRename,
  onCancelRename,
  onMenuOpenChange,
}: {
  canvasId: string;
  title: string;
  active: boolean;
  isShared: boolean;
  isSwitching: boolean;
  isPendingSwitch?: boolean;
  isEditing: boolean;
  menuOpen: boolean;
  editTitle: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  canRename: boolean;
  onSwitch: () => void;
  onStartRename: () => void;
  onEditTitleChange: (v: string) => void;
  onCommitRename: () => void;
  onCancelRename: () => void;
  onMenuOpenChange: (open: boolean) => void;
}) {
  return (
    <li>
      <div
        className={[
          "flex w-full items-center gap-1 rounded-lg px-2 py-2 transition-colors",
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
        {isPendingSwitch && (
          <span
            className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-canvas-border border-t-canvas-accent"
            aria-label="Opening canvas"
          />
        )}
        {isShared && <SharedIcon />}
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
            className="min-w-0 flex-1 rounded border border-canvas-border bg-canvas-card px-2 py-0.5 text-[17px] text-canvas-ink outline-none focus:border-canvas-accent"
            aria-label="Canvas title"
          />
        ) : (
          <button
            type="button"
            disabled={isSwitching || active || menuOpen}
            onClick={onSwitch}
            className={[
              "min-w-0 flex-1 truncate text-left text-[17px] disabled:cursor-default",
              active ? "font-medium text-canvas-ink" : "text-canvas-ink",
            ].join(" ")}
          >
            {title}
          </button>
        )}
        {canRename && !isEditing && (
          <CanvasRowMenu
            onRename={onStartRename}
            onOpenChange={onMenuOpenChange}
          />
        )}
      </div>
    </li>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M8 3v10M3 8h10" strokeLinecap="round" />
    </svg>
  );
}

function SharedIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-4 w-4 shrink-0 text-canvas-muted"
      fill="currentColor"
      aria-label="Shared canvas"
    >
      <path d="M10 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-7 8a7 7 0 0 1 14 0H3Zm12.5-2.5a5.5 5.5 0 0 0-9.5-3.9 5.5 5.5 0 0 0 7.8 7.8 5.5 5.5 0 0 0 1.7-3.9Z" />
    </svg>
  );
}
