"use client";

import { useRef, useState } from "react";
import {
  ArtefactIcon,
  BranchForkIcon,
  ChatBubbleIcon,
  PencilIcon,
  PlusIcon,
  SettingsIcon,
  ShareIcon,
} from "@/components/MenuIcons";
import { CanvasAddMenu } from "@/components/CanvasAddMenu";
import { CanvasArtifactMenu } from "@/components/CanvasArtifactMenu";
import { CanvasFontPopover } from "@/components/CanvasFontPopover";
import { CanvasGifPicker } from "@/components/CanvasGifPicker";
import { CanvasPencilPopover } from "@/components/CanvasPencilPopover";
import { CanvasSettingsPopover } from "@/components/CanvasSettingsPopover";
import { CollaboratorAvatarStack } from "@/components/CollaboratorAvatarStack";
import { UndoButton } from "@/components/UndoButton";
import { useCanEditCanvas, useAuth } from "@/components/AuthProvider";
import { isCanvasOwner } from "@/lib/collaborationPersistence";
import { uploadAssetFiles, type AssetUploadError } from "@/lib/attachments";
import { showUploadErrorsToast } from "@/lib/uploadErrorToast";
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
  const artefactBtnRef = useRef<HTMLButtonElement>(null);
  const pencilBtnRef = useRef<HTMLButtonElement>(null);
  const toolbarShellRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const model3dInputRef = useRef<HTMLInputElement>(null);
  const [fontOpen, setFontOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [artifactMenuOpen, setArtifactMenuOpen] = useState(false);
  const [pencilOpen, setPencilOpen] = useState(false);
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
  const requestArtifactPlacement = useCanvasStore((s) => s.requestArtifactPlacement);
  const activeCanvasPlacement = useCanvasStore((s) => s.activeCanvasPlacement);
  const setGifPickerOpen = useCanvasStore((s) => s.setGifPickerOpen);
  const gifPickerOpen = useCanvasStore((s) => s.gifPickerOpen);
  const addCanvasAsset = useCanvasStore((s) => s.addCanvasAsset);
  const requestImagePlacement = useCanvasStore((s) => s.requestImagePlacement);
  const createThreeDArtifactFromFile = useCanvasStore(
    (s) => s.createThreeDArtifactFromFile,
  );
  const pencilToolActive = useCanvasStore((s) => s.pencilToolActive);
  const pencilColor = useCanvasStore((s) => s.pencilColor);
  const setPencilToolActive = useCanvasStore((s) => s.setPencilToolActive);
  const setPencilColor = useCanvasStore((s) => s.setPencilColor);

  const showShare =
    Boolean(user && activeCanvasId) && isCanvasOwner(activeCanvasRole);

  const closeSubpanels = () => {
    setFontOpen(false);
    setSettingsOpen(false);
    setAddMenuOpen(false);
    setArtifactMenuOpen(false);
    setGifPickerOpen(false);
    setPencilOpen(false);
  };

  const deactivatePencil = () => {
    setPencilToolActive(false);
    setPencilOpen(false);
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

  const handle3DModelFiles = async (files: FileList | null) => {
    if (!files?.length || !canEdit) return;
    const uploadContext =
      user && activeCanvasId
        ? { userId: user.id, canvasId: activeCanvasId }
        : null;
    const errors: AssetUploadError[] = [];
    let created = false;

    for (let index = 0; index < files.length; index++) {
      const result = await createThreeDArtifactFromFile(files[index]!, {
        uploadContext,
        index,
        recordUndo: index === 0 && !created,
      });
      if ("error" in result) {
        errors.push(result.error);
      } else {
        created = true;
      }
    }

    if (errors.length > 0) {
      showUploadErrorsToast(errors);
    }
  };

  const artefactPlacementActive =
    activeCanvasPlacement === "question" || activeCanvasPlacement === "artifact";

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
      <input
        ref={model3dInputRef}
        type="file"
        accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
        className="hidden"
        onChange={(e) => {
          void handle3DModelFiles(e.target.files);
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
          onAdd3DModel={() => model3dInputRef.current?.click()}
          onAddGifs={() => {
            setAddMenuOpen(false);
            setGifPickerOpen(true);
          }}
        />
        <CanvasArtifactMenu
          open={artifactMenuOpen}
          onClose={() => setArtifactMenuOpen(false)}
          anchorRef={artefactBtnRef}
          containerRef={toolbarShellRef}
          disabled={!canEdit}
          onPick={(pick) => {
            closeSubpanels();
            if (pick.kind === "question") {
              requestCanvasPlacement("question");
            } else {
              requestArtifactPlacement(pick);
            }
          }}
        />
        <CanvasGifPicker
          anchorRef={addBtnRef}
          containerRef={toolbarShellRef}
        />
        <CanvasPencilPopover
          open={pencilOpen}
          onClose={() => setPencilOpen(false)}
          anchorRef={pencilBtnRef}
          containerRef={toolbarShellRef}
          active={pencilToolActive}
          color={pencilColor}
          disabled={!canEdit}
          onToggle={() => {
            if (pencilToolActive) {
              setPencilToolActive(false);
              setPencilOpen(false);
            } else {
              setPencilToolActive(true);
            }
          }}
          onColorChange={setPencilColor}
        />
        <div
          className="floating-chrome-padding flex items-center gap-1 rounded-canvas border border-canvas-border bg-canvas-card shadow-card"
          role="toolbar"
          aria-label="Canvas tools"
        >
          <button
            ref={artefactBtnRef}
            type="button"
            disabled={!canEdit}
            className={`${toolbarBtn} ${
              artifactMenuOpen || artefactPlacementActive
                ? "bg-canvas-bg text-canvas-ink"
                : ""
            }`}
            aria-pressed={artifactMenuOpen || artefactPlacementActive}
            aria-expanded={artifactMenuOpen}
            aria-haspopup="menu"
            onClick={() => {
              deactivatePencil();
              setFontOpen(false);
              setSettingsOpen(false);
              setGifPickerOpen(false);
              setArtifactMenuOpen((v) => !v);
            }}
          >
            <span className="text-canvas-muted">
              <ArtefactIcon />
            </span>
            Add artefact
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
              deactivatePencil();
              setFontOpen(false);
              setSettingsOpen(false);
              setGifPickerOpen(false);
              setArtifactMenuOpen(false);
              setAddMenuOpen((v) => !v);
            }}
          >
            <span className="text-canvas-muted">
              <PlusIcon />
            </span>
            Add
          </button>

          <button
            ref={pencilBtnRef}
            type="button"
            disabled={!canEdit}
            className={`${iconToggleBtn} ${
              pencilOpen || pencilToolActive
                ? "bg-canvas-bg text-canvas-ink"
                : "text-canvas-muted hover:text-canvas-ink"
            }`}
            aria-label="Pencil tool"
            aria-expanded={pencilOpen}
            aria-pressed={pencilToolActive}
            aria-haspopup="dialog"
            onClick={() => {
              if (pencilToolActive) {
                setPencilOpen((v) => !v);
                return;
              }
              setFontOpen(false);
              setSettingsOpen(false);
              setAddMenuOpen(false);
              setGifPickerOpen(false);
              setArtifactMenuOpen(false);
              setPencilToolActive(true);
              setPencilOpen(true);
            }}
          >
            <PencilIcon />
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
              setArtifactMenuOpen(false);
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
              setArtifactMenuOpen(false);
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
