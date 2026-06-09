"use client";

import { useRef, useState } from "react";
import {
  BranchForkIcon,
  ChatBubbleIcon,
  PlusIcon,
  QuestionIcon,
  SettingsIcon,
  ShareIcon,
} from "@/components/MenuIcons";
import { CanvasAddMenu } from "@/components/CanvasAddMenu";
import { CanvasFontPopover } from "@/components/CanvasFontPopover";
import { CanvasGifPicker } from "@/components/CanvasGifPicker";
import { CanvasSettingsPopover } from "@/components/CanvasSettingsPopover";
import { CollaboratorAvatarStack } from "@/components/CollaboratorAvatarStack";
import { UndoButton } from "@/components/UndoButton";
import { useCanEditCanvas, useAuth } from "@/components/AuthProvider";
import { isCanvasOwner } from "@/lib/collaborationPersistence";
import { uploadAssetFiles } from "@/lib/attachments";
import { useClientMounted } from "@/hooks/useClientMounted";
import { useCanvasStore } from "@/lib/store";

const toolbarBtn =
  "flex items-center gap-2 rounded-canvas px-3 py-2 text-canvas-body-sm font-medium text-canvas-ink transition-colors hover:bg-canvas-bg disabled:cursor-not-allowed disabled:opacity-40";

const iconToggleBtn =
  "flex h-9 w-9 items-center justify-center rounded-canvas transition-colors";

export function CanvasBottomToolbar() {
  const mounted = useClientMounted();
  const fontBtnRef = useRef<HTMLButtonElement>(null);
  const settingsBtnRef = useRef<HTMLButtonElement>(null);
  const addBtnRef = useRef<HTMLButtonElement>(null);
  const toolbarShellRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [fontOpen, setFontOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const canEdit = useCanEditCanvas();
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
  const requestCanvasPlacement = useCanvasStore((s) => s.requestCanvasPlacement);
  const activeCanvasPlacement = useCanvasStore((s) => s.activeCanvasPlacement);
  const setGifPickerOpen = useCanvasStore((s) => s.setGifPickerOpen);
  const gifPickerOpen = useCanvasStore((s) => s.gifPickerOpen);
  const addCanvasAsset = useCanvasStore((s) => s.addCanvasAsset);
  const requestImagePlacement = useCanvasStore((s) => s.requestImagePlacement);

  const showShare =
    Boolean(user && activeCanvasId) && isCanvasOwner(activeCanvasRole);

  const closeSubpanels = () => {
    setFontOpen(false);
    setSettingsOpen(false);
    setAddMenuOpen(false);
    setGifPickerOpen(false);
  };

  const handleImageFiles = async (files: FileList | null) => {
    if (!files?.length || !canEdit) return;
    const result = await uploadAssetFiles(
      files,
      user && activeCanvasId ? { userId: user.id, canvasId: activeCanvasId } : null,
    );
    const imageAsset = result.assets.find((asset) => asset.kind === "image");
    if (!imageAsset) return;
    addCanvasAsset(imageAsset);
    requestImagePlacement(imageAsset.id);
  };

  if (!mounted) {
    return (
      <div
        className="pointer-events-none absolute bottom-5 left-1/2 z-50 h-[52px] w-[min(100%,420px)] -translate-x-1/2 rounded-canvas border border-transparent"
        aria-hidden
      />
    );
  }

  return (
    <div className="pointer-events-auto absolute bottom-5 left-1/2 z-50 -translate-x-1/2">
      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={(e) => {
          void handleImageFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <div ref={toolbarShellRef} className="relative">
        <CanvasFontPopover
          open={fontOpen}
          onClose={() => setFontOpen(false)}
          anchorRef={fontBtnRef}
          containerRef={toolbarShellRef}
        />
        <CanvasSettingsPopover
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          anchorRef={settingsBtnRef}
          containerRef={toolbarShellRef}
        />
        <CanvasAddMenu
          open={addMenuOpen}
          onClose={() => setAddMenuOpen(false)}
          anchorRef={addBtnRef}
          containerRef={toolbarShellRef}
          disabled={!canEdit}
          onAddText={() => requestCanvasPlacement("text")}
          onAddImage={() => imageInputRef.current?.click()}
          onAddGifs={() => {
            setAddMenuOpen(false);
            setGifPickerOpen(true);
          }}
        />
        <CanvasGifPicker
          anchorRef={addBtnRef}
          containerRef={toolbarShellRef}
        />
        <div
          className="floating-chrome-padding flex items-center gap-1 rounded-canvas border border-canvas-border bg-canvas-card shadow-card"
          role="toolbar"
          aria-label="Canvas tools"
        >
          <button
            type="button"
            disabled={!canEdit}
            className={`${toolbarBtn} ${
              activeCanvasPlacement === "question"
                ? "bg-canvas-bg text-canvas-ink"
                : ""
            }`}
            aria-pressed={activeCanvasPlacement === "question"}
            onClick={() => {
              closeSubpanels();
              requestCanvasPlacement("question");
            }}
          >
            <span className="text-canvas-muted">
              <QuestionIcon />
            </span>
            Add question
          </button>
          <button
            ref={addBtnRef}
            type="button"
            disabled={!canEdit}
            className={`${toolbarBtn} ${
              addMenuOpen || gifPickerOpen || activeCanvasPlacement === "text"
                ? "bg-canvas-bg text-canvas-ink"
                : ""
            }`}
            aria-expanded={addMenuOpen || gifPickerOpen}
            aria-haspopup="menu"
            onClick={() => {
              setFontOpen(false);
              setSettingsOpen(false);
              setGifPickerOpen(false);
              setAddMenuOpen((v) => !v);
            }}
          >
            <span className="text-canvas-muted">
              <PlusIcon />
            </span>
            Add
          </button>

          {canEdit && <UndoButton variant="toolbar" />}

          {(showShare || members.length > 1) && (
            <>
              <div className="mx-1 h-7 w-px shrink-0 bg-canvas-border" aria-hidden />
              {showShare && (
                <button
                  type="button"
                  className={toolbarBtn}
                  onClick={() => setShareModalOpen(true)}
                >
                  <span className="text-canvas-muted">
                    <ShareIcon />
                  </span>
                  Share
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

          <div
            className="mx-1 h-7 w-px shrink-0 bg-canvas-border"
            aria-hidden
          />

          <button
            ref={fontBtnRef}
            type="button"
            className={`${iconToggleBtn} ${
              fontOpen
                ? "bg-canvas-bg text-canvas-ink"
                : "text-canvas-muted hover:text-canvas-ink"
            }`}
            aria-label="Font preview"
            aria-expanded={fontOpen}
            aria-haspopup="dialog"
            onClick={() => {
              setSettingsOpen(false);
              setAddMenuOpen(false);
              setGifPickerOpen(false);
              setFontOpen((v) => !v);
            }}
          >
            <span className="text-canvas-body-lg font-semibold leading-none">Aa</span>
          </button>

          <button
            ref={settingsBtnRef}
            type="button"
            className={`${iconToggleBtn} ${
              settingsOpen
                ? "bg-canvas-bg text-canvas-ink"
                : "text-canvas-muted hover:text-canvas-ink"
            }`}
            aria-label="Canvas settings"
            aria-expanded={settingsOpen}
            aria-haspopup="dialog"
            onClick={() => {
              setFontOpen(false);
              setAddMenuOpen(false);
              setGifPickerOpen(false);
              setSettingsOpen((v) => !v);
            }}
          >
            <SettingsIcon />
          </button>

          <div
            className="flex rounded-canvas bg-canvas-bg p-0.5"
            role="group"
            aria-label="View mode"
          >
            <button
              type="button"
              className={`${iconToggleBtn} ${
                viewMode === "canvas"
                  ? "bg-canvas-ink text-canvas-card shadow-card"
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
              className={`${iconToggleBtn} ${
                viewMode === "chat"
                  ? "bg-canvas-ink text-canvas-card shadow-card"
                  : "text-canvas-muted hover:text-canvas-ink"
              }`}
              aria-label="Chat view"
              aria-pressed={viewMode === "chat"}
              onClick={() => setViewMode("chat")}
            >
              <ChatBubbleIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
