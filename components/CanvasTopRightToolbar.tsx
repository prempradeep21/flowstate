"use client";

import { useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { CanvasSearch } from "@/components/canvas/CanvasSearch";
import { CanvasSettingsPopover } from "@/components/CanvasSettingsPopover";
import { CollaboratorAvatarStack } from "@/components/CollaboratorAvatarStack";
import { EyeIcon, EyeOffIcon, GearIcon, ShareIcon } from "@/components/MenuIcons";
import {
  iconToggleBtn,
  toolbarActive,
  toolbarBtn,
} from "@/components/toolbarButtonClasses";
import { isCanvasOwner } from "@/lib/collaborationPersistence";
import { useCanvasStore } from "@/lib/store";

function Divider() {
  return <div className="mx-0.5 h-6 w-px shrink-0 bg-canvas-border" aria-hidden />;
}

/**
 * Search, sharing, hide-chats and canvas settings — the canvas-wide controls
 * that sit in the top-right unit beside the Artifacts toggle. Search and
 * hide-chats only act on the canvas surface, so the chat view drops them.
 *
 * `framed` gives the group its own pill; AppRightPanel turns it off while the
 * Artifacts panel is collapsed, when the whole unit shares one pill.
 */
export function CanvasTopRightToolbar({ framed }: { framed: boolean }) {
  const settingsBtnRef = useRef<HTMLButtonElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const {
    activeCanvasRole,
    setShareModalOpen,
    user,
    activeCanvasId,
    members,
    onlineUserIds,
  } = useAuth();
  const viewMode = useCanvasStore((s) => s.viewMode);
  const chatsGloballyHidden = useCanvasStore((s) => s.chatsGloballyHidden);
  const toggleChatsGloballyHidden = useCanvasStore(
    (s) => s.toggleChatsGloballyHidden,
  );
  const setPencilToolActive = useCanvasStore((s) => s.setPencilToolActive);

  const canvasTools = viewMode === "canvas";
  const showShare =
    Boolean(user && activeCanvasId) && isCanvasOwner(activeCanvasRole);
  const showShareGroup = showShare || members.length > 1;

  return (
    <div
      ref={shellRef}
      role="toolbar"
      aria-label="Canvas controls"
      className={`relative flex items-center gap-1 ${
        framed
          ? "rounded-canvas border border-canvas-border bg-canvas-card p-1 shadow-card"
          : ""
      }`}
    >
      <CanvasSettingsPopover
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        anchorRef={settingsBtnRef}
        containerRef={shellRef}
        placement="below"
      />

      {canvasTools && (
        <>
          <CanvasSearch bare />
          <Divider />
        </>
      )}

      {showShareGroup && (
        <>
          {showShare && (
            <button
              type="button"
              data-coach-target="share-btn"
              className={toolbarBtn}
              aria-label="Share"
              onClick={() => setShareModalOpen(true)}
            >
              <span className="text-canvas-muted">
                <ShareIcon />
              </span>
              <span className="hidden sm:inline">Share</span>
            </button>
          )}
          <CollaboratorAvatarStack
            members={members}
            onlineUserIds={onlineUserIds}
            onClick={() => setShareModalOpen(true)}
            size="sm"
          />
        </>
      )}

      {canvasTools && (
        <button
          type="button"
          className={`${toolbarBtn} ${chatsGloballyHidden ? toolbarActive : ""}`}
          aria-pressed={chatsGloballyHidden}
          aria-label={chatsGloballyHidden ? "Show chats" : "Hide chats"}
          onClick={() => {
            setPencilToolActive(false);
            setSettingsOpen(false);
            toggleChatsGloballyHidden();
          }}
        >
          <span className="text-canvas-muted">
            {chatsGloballyHidden ? <EyeIcon /> : <EyeOffIcon />}
          </span>
          <span className="hidden sm:inline">
            {chatsGloballyHidden ? "Show chats" : "Hide chats"}
          </span>
        </button>
      )}

      <button
        ref={settingsBtnRef}
        type="button"
        className={`${iconToggleBtn} ${
          settingsOpen ? toolbarActive : "text-canvas-muted hover:text-canvas-ink"
        }`}
        aria-label="Canvas settings"
        aria-expanded={settingsOpen}
        aria-haspopup="dialog"
        onClick={() => setSettingsOpen((v) => !v)}
      >
        <GearIcon />
      </button>
    </div>
  );
}
