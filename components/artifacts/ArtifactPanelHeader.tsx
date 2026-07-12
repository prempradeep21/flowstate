"use client";

import { useEffect, useRef, useState } from "react";
import { ContributorAvatarStack } from "@/components/ContributorAvatarStack";
import {
  CanvasFloatingMenuPortal,
  useCanvasFloatingMenuPosition,
} from "@/components/CanvasFloatingMenu";
import { ArtifactTypeIcon } from "@/components/artifacts/ArtifactTypeIcon";
import { EditableArtifactTitle } from "@/components/artifacts/EditableArtifactTitle";
import type { CollaboratorProfile } from "@/lib/collaborationTypes";
import {
  ArtifactHeaderNestedMenu,
  artifactHeaderMenuHasActions,
} from "@/components/artifacts/ArtifactHeaderNestedMenu";
import { useArtifactMenuControls } from "@/components/artifacts/ArtifactMenuControlsContext";
import type { ArtifactKind, ArtifactPayload } from "@/lib/artifactTypes";
import type { ArtifactVersion } from "@/lib/sessionArtifacts";
import type { GoogleDriveFileKind } from "@/lib/google/parseDriveUrl";
import { ARTIFACT_CANVAS_CHROME_OPACITY, ARTIFACT_CANVAS_CHROME_POINTER } from "@/lib/artifactCanvasChrome";
import { artifactCategoryStyle } from "@/lib/design/theme/artifactCategories";
import { tableAccentStyles } from "@/lib/tableAccentColor";

export interface ArtifactEditControls {
  canEdit: boolean;
  isEditing: boolean;
  isDirty: boolean;
  onEdit: () => void;
  onSave: () => void;
  onDiscard: () => void;
  onCancelEdit: () => void;
  /** When true, dirty edit mode shows Save only (no Discard). */
  saveOnly?: boolean;
}

/** @deprecated Use ArtifactEditControls */
export type TodoEditControls = ArtifactEditControls;

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={className ?? "h-4 w-4 shrink-0"}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path
        d="M6 3h7v7M13 3L6 10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ArtifactPanelHeader({
  kind,
  title,
  renameTitle,
  canRenameTitle = false,
  onRenameTitle,
  artifactId,
  versions,
  activeVersionId,
  onVersionChange,
  menuVariant = "panel",
  onRemoveFromCanvas,
  contributorProfiles,
  todoEditControls,
  stickyEditControls,
  isVideo = false,
  websiteUrl,
  googleFileKind,
  exportPayload,
}: {
  kind: ArtifactKind;
  title: string;
  renameTitle?: string;
  canRenameTitle?: boolean;
  onRenameTitle?: (title: string) => void;
  artifactId?: string;
  versions: ArtifactVersion[];
  activeVersionId: string;
  onVersionChange: (versionId: string) => void;
  menuVariant?: "canvas" | "panel";
  onRemoveFromCanvas?: () => void;
  contributorProfiles?: CollaboratorProfile[];
  todoEditControls?: ArtifactEditControls;
  stickyEditControls?: ArtifactEditControls;
  isVideo?: boolean;
  websiteUrl?: string;
  googleFileKind?: GoogleDriveFileKind;
  exportPayload?: ArtifactPayload;
}) {
  const [versionOpen, setVersionOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const versionRef = useRef<HTMLDivElement>(null);
  const versionButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const safeVersions = Array.isArray(versions) ? versions : [];
  const active =
    safeVersions.find((v) => v.id === activeVersionId) ??
    safeVersions[safeVersions.length - 1];
  const isCanvas = menuVariant === "canvas";
  const versionMenuPortal = useCanvasFloatingMenuPosition(
    versionOpen && isCanvas,
    versionButtonRef,
  );
  const actionMenuPortal = useCanvasFloatingMenuPosition(
    menuOpen && isCanvas,
    menuButtonRef,
  );

  useEffect(() => {
    if (!versionOpen) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (versionRef.current?.contains(target)) return;
      if (versionMenuPortal.portalRef.current?.contains(target)) return;
      setVersionOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [versionOpen, versionMenuPortal.portalRef]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target)) return;
      if (actionMenuPortal.portalRef.current?.contains(target)) return;
      setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen, actionMenuPortal.portalRef]);

  const menuControls = useArtifactMenuControls();
  const hasMenuActions = artifactHeaderMenuHasActions({
    exportPayload,
    onRemoveFromCanvas,
    hasDisplayMenu: menuControls?.hasDisplayMenu,
  });

  const editControls = todoEditControls ?? stickyEditControls;

  const showArtifactEdit =
    editControls?.canEdit && !editControls.isEditing;
  const showArtifactSaveDiscard =
    editControls?.isEditing && editControls.isDirty;
  const showArtifactCancel =
    editControls?.isEditing && !editControls.isDirty;

  const ctaClass =
    "flex h-11 shrink-0 items-center rounded-full px-4 text-canvas-heading font-medium transition-colors";
  const chromeClass = isCanvas
    ? `${ARTIFACT_CANVAS_CHROME_OPACITY} ${ARTIFACT_CANVAS_CHROME_POINTER}`
    : "";
  const menuDropdownClassName =
    "min-w-[220px] max-h-[min(420px,70vh)] overflow-y-auto rounded-canvas border border-canvas-border bg-canvas-card py-1 shadow-card";
  const closeMenu = () => setMenuOpen(false);
  const versionDropdownClassName =
    "min-w-[140px] overflow-hidden rounded-canvas border border-canvas-border bg-canvas-card py-1 shadow-card";

  const showVersion =
    !isVideo && kind !== "website" && !(kind === "google-doc" && websiteUrl);

  const showContributors =
    contributorProfiles != null && contributorProfiles.length > 0;

  return (
    <div
      className={`artifact-panel-header flex items-center gap-[11px]${isCanvas ? " py-3.5 pl-4 pr-2" : " h-14"}`}
      data-artifact-kind={isVideo ? "video" : kind}
    >
      <span
        className="artifact-header-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-canvas-ink"
        style={
          kind === "table" && artifactId
            ? tableAccentStyles(artifactId)
            : artifactCategoryStyle(isVideo ? "video" : kind)
        }
      >
        <span
          className="flex h-full w-full items-center justify-center rounded-full"
          style={
            kind === "table" && artifactId
              ? { background: "var(--table-accent-soft)" }
              : undefined
          }
        >
          <ArtifactTypeIcon
            kind={isVideo ? "video" : kind}
            googleFileKind={kind === "google-doc" ? googleFileKind : undefined}
            className="h-[22px] w-[22px]"
          />
        </span>
      </span>
      <EditableArtifactTitle
        displayTitle={title}
        renameTitle={renameTitle ?? title}
        canRename={canRenameTitle && Boolean(onRenameTitle)}
        onRename={(next) => onRenameTitle?.(next)}
      />

      {showArtifactEdit && (
        <button
          type="button"
          onClick={editControls.onEdit}
          className={`${ctaClass} border border-canvas-ink/20 text-canvas-ink hover:bg-canvas-bg`}
        >
          Edit
        </button>
      )}

      {showArtifactCancel && (
        <button
          type="button"
          onClick={editControls.onCancelEdit}
          className={`${ctaClass} border border-canvas-ink/20 text-canvas-muted hover:bg-canvas-bg hover:text-canvas-ink`}
        >
          Cancel
        </button>
      )}

      {showArtifactSaveDiscard && (
        <div className="flex shrink-0 items-center gap-2">
          {!editControls.saveOnly && (
            <button
              type="button"
              onClick={editControls.onDiscard}
              className={`${ctaClass} text-canvas-muted hover:bg-canvas-bg hover:text-canvas-ink`}
            >
              Discard
            </button>
          )}
          <button
            type="button"
            onClick={editControls.onSave}
            className={`${ctaClass} bg-canvas-accent text-white hover:opacity-90`}
          >
            Save
          </button>
        </div>
      )}

      {kind === "website" && websiteUrl ? (
        <a
          href={websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          data-no-drag
          className={`${ctaClass} gap-1.5 border border-canvas-ink/20 text-canvas-ink hover:bg-canvas-bg ${chromeClass}`}
        >
          Visit website
          <ExternalLinkIcon />
        </a>
      ) : kind === "google-doc" && websiteUrl ? (
        <a
          href={websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          data-no-drag
          className={`${ctaClass} gap-1.5 border border-canvas-ink/20 text-canvas-ink hover:bg-canvas-bg ${chromeClass}`}
        >
          Open in Google
          <ExternalLinkIcon />
        </a>
      ) : null}

      {(showContributors || showVersion || hasMenuActions) && (
        <div className="flex shrink-0 items-center gap-2">
      {showContributors && (
        <div className={`shrink-0 ${isCanvas ? chromeClass : ""}`}>
          <ContributorAvatarStack profiles={contributorProfiles} size={28} />
        </div>
      )}
      {!showVersion ? null : (
          <div
            className={`relative shrink-0 ${chromeClass} ${
              versionOpen ? "opacity-100" : ""
            }`}
            ref={versionRef}
          >
            <button
              ref={versionButtonRef}
              type="button"
              onClick={() => setVersionOpen((o) => !o)}
              className={`${ctaClass} gap-1.5 border border-canvas-ink/20 text-canvas-ink hover:bg-canvas-bg`}
            >
              Version {active?.number ?? 1}
              <span className="text-canvas-body opacity-70" aria-hidden>
                ⌵
              </span>
            </button>
            {versionOpen &&
              (isCanvas ? (
                <CanvasFloatingMenuPortal
                  open={versionOpen}
                  style={versionMenuPortal.style}
                  portalRef={versionMenuPortal.portalRef}
                  className={versionDropdownClassName}
                >
                  {[...safeVersions].reverse().map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => {
                        onVersionChange(v.id);
                        setVersionOpen(false);
                      }}
                      className={`block w-full px-3 py-2 text-left text-canvas-body-sm ${
                        v.id === activeVersionId
                          ? "bg-canvas-bg font-medium text-canvas-ink"
                          : "text-canvas-muted hover:bg-canvas-bg hover:text-canvas-ink"
                      }`}
                    >
                      Version {v.number}
                    </button>
                  ))}
                </CanvasFloatingMenuPortal>
              ) : (
                <div
                  className={`absolute right-0 top-full z-50 mt-1 ${versionDropdownClassName}`}
                >
                  {[...safeVersions].reverse().map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => {
                        onVersionChange(v.id);
                        setVersionOpen(false);
                      }}
                      className={`block w-full px-3 py-2 text-left text-canvas-body-sm ${
                        v.id === activeVersionId
                          ? "bg-canvas-bg font-medium text-canvas-ink"
                          : "text-canvas-muted hover:bg-canvas-bg hover:text-canvas-ink"
                      }`}
                    >
                      Version {v.number}
                    </button>
                  ))}
                </div>
              ))}
          </div>
      )}
      {hasMenuActions && (
        <div
          className={`relative shrink-0 ${chromeClass} ${
            menuOpen ? "opacity-100" : ""
          }`}
          ref={menuRef}
        >
          <button
            ref={menuButtonRef}
            type="button"
            aria-label="More options"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
            className={`flex shrink-0 items-center justify-center rounded-full text-canvas-muted transition-colors hover:bg-canvas-bg hover:text-canvas-ink ${
              isCanvas ? "h-11 w-9" : "h-10 w-10"
            }`}
          >
            <svg viewBox="0 0 16 16" className="h-[22px] w-[22px]" fill="currentColor" aria-hidden>
              <circle cx="8" cy="3.5" r="1.25" />
              <circle cx="8" cy="8" r="1.25" />
              <circle cx="8" cy="12.5" r="1.25" />
            </svg>
          </button>
          {menuOpen &&
            (isCanvas ? (
              <CanvasFloatingMenuPortal
                open={menuOpen}
                style={actionMenuPortal.style}
                portalRef={actionMenuPortal.portalRef}
                className={menuDropdownClassName}
              >
                <ArtifactHeaderNestedMenu
                  kind={kind}
                  title={title}
                  artifactId={artifactId}
                  exportPayload={exportPayload}
                  onRemoveFromCanvas={onRemoveFromCanvas}
                  onClose={closeMenu}
                />
              </CanvasFloatingMenuPortal>
            ) : (
              <div
                className={`absolute right-0 top-full z-50 mt-1 ${menuDropdownClassName}`}
              >
                <ArtifactHeaderNestedMenu
                  kind={kind}
                  title={title}
                  artifactId={artifactId}
                  exportPayload={exportPayload}
                  onRemoveFromCanvas={onRemoveFromCanvas}
                  onClose={closeMenu}
                />
              </div>
            ))}
        </div>
      )}
        </div>
      )}
    </div>
  );
}
