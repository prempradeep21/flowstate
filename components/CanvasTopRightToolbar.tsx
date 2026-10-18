"use client";

import { AnimatePresence, m } from "framer-motion";
import { useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { CanvasSettingsPopover } from "@/components/CanvasSettingsPopover";
import { CollaboratorAvatarStack } from "@/components/CollaboratorAvatarStack";
import { MotionAutoWidth } from "@/components/motion/MotionAutoWidth";
import {
  BranchForkIcon,
  ChatBubbleIcon,
  EyeIcon,
  EyeOffIcon,
  GearIcon,
  ShareIcon,
} from "@/components/MenuIcons";
import {
  iconToggleBtn,
  toolbarActive,
  toolbarBtn,
} from "@/components/toolbarButtonClasses";
import { isCanvasOwner } from "@/lib/collaborationPersistence";
import { framerTransition } from "@/lib/motion/transitions";
import { useCanvasStore } from "@/lib/store";

/** Controls that come and go with the view: fade in once the shell has begun
 *  widening, fade out fast before it narrows. */
const viewScopedFade = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { ...framerTransition("standard", "easeMedium"), delay: 0.06 },
  },
  exit: { opacity: 0, transition: framerTransition("instant", "easeLight") },
};

function Divider() {
  return (
    <div className="mx-0.5 h-6 w-px shrink-0 bg-canvas-border" aria-hidden />
  );
}

/**
 * View switch, sharing, hide-chats and canvas settings — the canvas-wide
 * controls that sit in the top-right unit beside the Artifacts toggle.
 * Hide-chats only acts on the canvas surface, so the chat view drops it.
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
  const setViewMode = useCanvasStore((s) => s.setViewMode);
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
      className={`relative flex items-center ${
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

      <MotionAutoWidth>
        {/* h-8 buttons + p-0.5 keep this track at 36px, the same as the other
          buttons, so the unit stays level with the search and left chip. The
          selected chip slides between the two views. */}
        <div
          className="relative flex rounded-canvas bg-canvas-bg p-0.5"
          role="group"
          aria-label="View mode"
        >
          {(viewMode === "canvas" || viewMode === "chat") && (
            <span
              aria-hidden
              className="absolute left-0.5 top-0.5 h-8 w-8 rounded-canvas bg-canvas-card shadow-card transition-transform duration-motion-standard ease-motion-medium motion-reduce:transition-none"
              style={{
                transform: `translateX(${viewMode === "chat" ? "100%" : "0"})`,
              }}
            />
          )}
          <button
            type="button"
            className={`btn relative h-8 w-8 rounded-canvas ${
              viewMode === "canvas"
                ? "text-canvas-ink"
                : "text-canvas-muted hover:text-canvas-ink"
            }`}
            aria-label="Canvas view"
            aria-pressed={viewMode === "canvas"}
            onClick={() => setViewMode("canvas")}
          >
            <BranchForkIcon />
          </button>
          <button
            type="button"
            className={`btn relative h-8 w-8 rounded-canvas ${
              viewMode === "chat"
                ? "text-canvas-ink"
                : "text-canvas-muted hover:text-canvas-ink"
            }`}
            aria-label="Chat view"
            aria-pressed={viewMode === "chat"}
            onClick={() => setViewMode("chat")}
          >
            <ChatBubbleIcon />
          </button>
        </div>
        <Divider />

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

        <AnimatePresence initial={false}>
          {canvasTools && (
            <m.button
              key="hide-chats"
              {...viewScopedFade}
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
            </m.button>
          )}
        </AnimatePresence>

        <button
          ref={settingsBtnRef}
          type="button"
          className={`${iconToggleBtn} ${
            settingsOpen
              ? toolbarActive
              : "text-canvas-muted hover:text-canvas-ink"
          }`}
          aria-label="Canvas settings"
          aria-expanded={settingsOpen}
          aria-haspopup="dialog"
          onClick={() => setSettingsOpen((v) => !v)}
        >
          <GearIcon />
        </button>
      </MotionAutoWidth>
    </div>
  );
}
