"use client";

import { useState } from "react";
import {
  ArtifactCodeCopyMenuItem,
  ArtifactCopyCodeMenuItems,
} from "@/components/artifacts/ArtifactCopyCodeButton";
import { ArtifactExportMenuItems } from "@/components/artifacts/ArtifactExportMenu";
import { useArtifactMenuControls } from "@/components/artifacts/ArtifactMenuControlsContext";
import {
  ArtifactNestedMenuBackHeader,
  ArtifactNestedMenuNavItem,
  ArtifactNestedMenuShell,
  type ArtifactNestedMenuView,
} from "@/components/artifacts/ArtifactNestedMenu";
import { ArtifactMenuFontScaleRow } from "@/components/artifacts/menu/ArtifactMenuControlRows";
import { ContextMenuItem, EyeOffIcon } from "@/components/MenuIcons";
import type { ArtifactKind, ArtifactPayload } from "@/lib/artifactTypes";

export function ArtifactHeaderNestedMenu({
  kind,
  title,
  artifactId,
  exportPayload,
  onRemoveFromCanvas,
  onClose,
}: {
  kind: ArtifactKind;
  title: string;
  artifactId?: string;
  exportPayload?: ArtifactPayload;
  onRemoveFromCanvas?: () => void;
  onClose: () => void;
}) {
  const menuCtx = useArtifactMenuControls();
  const [view, setView] = useState<ArtifactNestedMenuView>("root");

  const hasDisplay = menuCtx?.hasDisplayMenu ?? false;
  const hasExport = Boolean(exportPayload);
  const showCanvasHide = Boolean(onRemoveFromCanvas);

  return (
    <ArtifactNestedMenuShell>
      {view === "root" ? (
        <>
          {hasDisplay ? (
            <ArtifactNestedMenuNavItem
              label="Display"
              onNavigate={() => setView("display")}
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

      {view === "display" && menuCtx ? (
        <>
          <ArtifactNestedMenuBackHeader
            title="Display"
            onBack={() => setView("root")}
          />
          {menuCtx.displayExtras}
          {menuCtx.showFontControls ? (
            <ArtifactMenuFontScaleRow
              scale={menuCtx.fontScale}
              onScaleChange={menuCtx.setFontScale}
            />
          ) : null}
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
  hasDisplayMenu,
}: {
  exportPayload?: ArtifactPayload;
  onRemoveFromCanvas?: () => void;
  hasDisplayMenu?: boolean;
}): boolean {
  return Boolean(exportPayload || onRemoveFromCanvas || hasDisplayMenu);
}
