"use client";

import { useState } from "react";
import {
  ArtifactCodeCopyMenuItem,
  ArtifactCopyCodeMenuItems,
} from "@/components/artifacts/ArtifactCopyCodeButton";
import { ArtifactExportMenuItems } from "@/components/artifacts/ArtifactExportMenu";
import {
  ArtifactNestedMenuBackHeader,
  ArtifactNestedMenuNavItem,
  ArtifactNestedMenuShell,
  type ArtifactNestedMenuView,
} from "@/components/artifacts/ArtifactNestedMenu";
import { ContextMenuItem, EyeOffIcon } from "@/components/MenuIcons";
import type { ArtifactKind, ArtifactPayload } from "@/lib/artifactTypes";
import type { ArtifactVersion } from "@/lib/sessionArtifacts";

/** The version list the ⋯ menu offers; omitted for kinds that have no versions. */
export interface ArtifactHeaderMenuVersions {
  versions: ArtifactVersion[];
  activeVersionId: string;
  onVersionChange: (versionId: string) => void;
}

export function ArtifactHeaderNestedMenu({
  kind,
  title,
  artifactId,
  exportPayload,
  versions,
  onRemoveFromCanvas,
  onClose,
}: {
  kind: ArtifactKind;
  title: string;
  artifactId?: string;
  exportPayload?: ArtifactPayload;
  versions?: ArtifactHeaderMenuVersions;
  onRemoveFromCanvas?: () => void;
  onClose: () => void;
}) {
  const [view, setView] = useState<ArtifactNestedMenuView>("root");

  const versionList = versions?.versions ?? [];
  const hasVersions = versionList.length > 0;
  const activeVersion =
    versionList.find((v) => v.id === versions?.activeVersionId) ??
    versionList[versionList.length - 1];
  const hasExport = Boolean(exportPayload);
  const showCanvasHide = Boolean(onRemoveFromCanvas);

  return (
    <ArtifactNestedMenuShell>
      {view === "root" ? (
        <>
          {hasVersions ? (
            <ArtifactNestedMenuNavItem
              label="Version"
              detail={`v${activeVersion?.number ?? 1}`}
              onNavigate={() => setView("version")}
            />
          ) : null}
          {hasExport ? (
            <ArtifactNestedMenuNavItem
              label="Export"
              onNavigate={() => setView("export")}
            />
          ) : null}
          {showCanvasHide ? (
            <ContextMenuItem
              icon={<EyeOffIcon />}
              label="Hide"
              onClick={() => {
                onClose();
                onRemoveFromCanvas?.();
              }}
            />
          ) : null}
        </>
      ) : null}

      {view === "version" && versions ? (
        <>
          <ArtifactNestedMenuBackHeader
            title="Version"
            onBack={() => setView("root")}
          />
          {[...versionList].reverse().map((v) => (
            <button
              key={v.id}
              type="button"
              role="menuitemradio"
              aria-checked={v.id === activeVersion?.id}
              onClick={() => {
                versions.onVersionChange(v.id);
                onClose();
              }}
              className={`block w-full px-3 py-2 text-left text-canvas-body-sm ${
                v.id === activeVersion?.id
                  ? "bg-canvas-accentSoft font-medium text-canvas-accent"
                  : "text-canvas-muted hover:bg-canvas-bg hover:text-canvas-ink"
              }`}
            >
              Version {v.number}
            </button>
          ))}
        </>
      ) : null}

      {view === "export" && exportPayload ? (
        <>
          <ArtifactNestedMenuBackHeader
            title="Export"
            onBack={() => setView("root")}
          />
          {kind === "code" ? (
            <ArtifactCodeCopyMenuItem onClose={onClose} />
          ) : (
            <ArtifactCopyCodeMenuItems
              kind={kind}
              payload={exportPayload}
              title={title}
              artifactId={artifactId}
              onClose={onClose}
            />
          )}
          <ArtifactExportMenuItems
            kind={kind}
            payload={exportPayload}
            title={title}
            artifactId={artifactId}
            onClose={onClose}
          />
        </>
      ) : null}
    </ArtifactNestedMenuShell>
  );
}

export function artifactHeaderMenuHasActions({
  exportPayload,
  onRemoveFromCanvas,
  versions,
}: {
  exportPayload?: ArtifactPayload;
  onRemoveFromCanvas?: () => void;
  versions?: ArtifactHeaderMenuVersions;
}): boolean {
  return Boolean(
    exportPayload || onRemoveFromCanvas || (versions?.versions.length ?? 0) > 0,
  );
}
