"use client";

import { useEffect, useRef, useState } from "react";
import { ContributorAvatarStack } from "@/components/ContributorAvatarStack";
import { ArtifactTypeIcon } from "@/components/artifacts/ArtifactTypeIcon";
import type { CollaboratorProfile } from "@/lib/collaborationTypes";
import type { ArtifactKind } from "@/lib/artifactTypes";
import type { ArtifactVersion } from "@/lib/sessionArtifacts";
import { tableAccentStyles } from "@/lib/tableAccentColor";

export interface TodoEditControls {
  canEdit: boolean;
  isEditing: boolean;
  isDirty: boolean;
  onEdit: () => void;
  onSave: () => void;
  onDiscard: () => void;
  onCancelEdit: () => void;
}

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
  artifactId,
  versions,
  activeVersionId,
  onVersionChange,
  menuVariant = "panel",
  onExpand,
  onRemoveFromCanvas,
  contributorProfiles,
  todoEditControls,
  isVideo = false,
  websiteUrl,
}: {
  kind: ArtifactKind;
  title: string;
  artifactId?: string;
  versions: ArtifactVersion[];
  activeVersionId: string;
  onVersionChange: (versionId: string) => void;
  menuVariant?: "canvas" | "panel";
  onExpand?: () => void;
  onRemoveFromCanvas?: () => void;
  contributorProfiles?: CollaboratorProfile[];
  todoEditControls?: TodoEditControls;
  isVideo?: boolean;
  websiteUrl?: string;
}) {
  const [versionOpen, setVersionOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const versionRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const safeVersions = Array.isArray(versions) ? versions : [];
  const active =
    safeVersions.find((v) => v.id === activeVersionId) ??
    safeVersions[safeVersions.length - 1];

  useEffect(() => {
    if (!versionOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (versionRef.current && !versionRef.current.contains(e.target as Node)) {
        setVersionOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [versionOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

  const hasMenuActions =
    menuVariant === "canvas"
      ? Boolean(onExpand || onRemoveFromCanvas)
      : false;

  const showTodoEdit =
    todoEditControls?.canEdit && !todoEditControls.isEditing;
  const showTodoSaveDiscard =
    todoEditControls?.isEditing && todoEditControls.isDirty;
  const showTodoCancel =
    todoEditControls?.isEditing && !todoEditControls.isDirty;

  const ctaClass =
    "flex h-11 shrink-0 items-center rounded-full px-4 text-canvas-heading font-medium transition-colors";

  return (
    <div className="flex h-14 items-center gap-[11px]">
      {contributorProfiles && contributorProfiles.length > 0 && (
        <ContributorAvatarStack profiles={contributorProfiles} size={28} />
      )}
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-canvas-ink ${
          kind === "table" && artifactId ? "" : "bg-canvas-artifactIconBg"
        }`}
        style={
          kind === "table" && artifactId
            ? tableAccentStyles(artifactId)
            : undefined
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
            className="h-[22px] w-[22px]"
          />
        </span>
      </span>
      <h2 className="min-w-0 flex-1 truncate text-canvas-heading font-semibold leading-tight text-canvas-ink">
        {title}
      </h2>

      {showTodoEdit && (
        <button
          type="button"
          onClick={todoEditControls.onEdit}
          className={`${ctaClass} border border-canvas-ink/20 text-canvas-ink hover:bg-canvas-bg`}
        >
          Edit
        </button>
      )}

      {showTodoCancel && (
        <button
          type="button"
          onClick={todoEditControls.onCancelEdit}
          className={`${ctaClass} border border-canvas-ink/20 text-canvas-muted hover:bg-canvas-bg hover:text-canvas-ink`}
        >
          Cancel
        </button>
      )}

      {showTodoSaveDiscard && (
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={todoEditControls.onDiscard}
            className={`${ctaClass} text-canvas-muted hover:bg-canvas-bg hover:text-canvas-ink`}
          >
            Discard
          </button>
          <button
            type="button"
            onClick={todoEditControls.onSave}
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
          className={`${ctaClass} gap-1.5 border border-canvas-ink/20 text-canvas-ink hover:bg-canvas-bg`}
        >
          Visit website
          <ExternalLinkIcon />
        </a>
      ) : (
        !isVideo && (
          <div className="relative shrink-0" ref={versionRef}>
            <button
              type="button"
              onClick={() => setVersionOpen((o) => !o)}
              className={`${ctaClass} gap-1.5 border border-canvas-ink/20 text-canvas-ink hover:bg-canvas-bg`}
            >
              Version {active?.number ?? 1}
              <span className="text-canvas-body opacity-70" aria-hidden>
                ⌵
              </span>
            </button>
            {versionOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 min-w-[140px] overflow-hidden rounded-canvas border border-canvas-border bg-canvas-card py-1 shadow-card">
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
            )}
          </div>
        )
      )}
      {hasMenuActions && (
        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            aria-label="More options"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-canvas-muted transition-colors hover:bg-canvas-bg hover:text-canvas-ink"
          >
            <svg viewBox="0 0 16 16" className="h-[22px] w-[22px]" fill="currentColor" aria-hidden>
              <circle cx="8" cy="3.5" r="1.25" />
              <circle cx="8" cy="8" r="1.25" />
              <circle cx="8" cy="12.5" r="1.25" />
            </svg>
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 min-w-[160px] overflow-hidden rounded-canvas border border-canvas-border bg-canvas-card py-1 shadow-card">
              {onExpand && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onExpand();
                  }}
                  className="block w-full px-3 py-2 text-left text-canvas-body-sm text-canvas-ink hover:bg-canvas-bg"
                >
                  Expand
                </button>
              )}
              {onRemoveFromCanvas && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onRemoveFromCanvas();
                  }}
                  className="block w-full px-3 py-2 text-left text-canvas-body-sm text-canvas-muted hover:bg-canvas-bg hover:text-canvas-ink"
                >
                  Remove from canvas
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
