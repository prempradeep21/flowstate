"use client";

import { useState } from "react";
import { ContextMenuItem } from "@/components/MenuIcons";
import { useArtifactExport } from "@/components/artifacts/ArtifactExportContext";
import { exportMenuItemIcon } from "@/components/artifacts/artifactHeaderMenuIcons";
import { useGoogleConnection } from "@/hooks/useGoogleConnection";
import type { ArtifactKind, ArtifactPayload } from "@/lib/artifactTypes";
import { showAppErrorToast, showAppToast } from "@/lib/appToastStore";
import { executeExportAction } from "@/lib/artifactExport/executeExport";
import { getExportMenuItems } from "@/lib/artifactExport/registry";
import type { ExportMenuItem } from "@/lib/artifactExport/types";

function groupBySection(items: ExportMenuItem[]): Record<string, ExportMenuItem[]> {
  const groups: Record<string, ExportMenuItem[]> = {};
  for (const item of items) {
    const key = item.section ?? "default";
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }
  return groups;
}

function sectionLabel(section: string): string {
  switch (section) {
    case "image":
      return "Image";
    case "data":
      return "Data";
    case "google":
      return "Google";
    case "download":
      return "Download";
    default:
      return section;
  }
}

export function useArtifactExportMenuActions({
  kind,
  payload,
  title,
  artifactId,
}: {
  kind: ArtifactKind;
  payload: ArtifactPayload;
  title: string;
  artifactId?: string;
}) {
  const [busy, setBusy] = useState(false);
  const { buildExportContext } = useArtifactExport();
  const { connected, connect } = useGoogleConnection();
  const items = getExportMenuItems(kind, payload);
  const sections = groupBySection(items);

  const runExport = async (item: ExportMenuItem, onClose?: () => void) => {
    if (item.kind === "google-sheets" && !connected) {
      connect();
      showAppToast("Connect Google Drive to export to Sheets.");
      onClose?.();
      return;
    }

    setBusy(true);
    try {
      const ctx = buildExportContext(kind, payload, title, artifactId);
      const result = await executeExportAction(ctx, item.kind, item.id);
      if (result.ok) {
        showAppToast(result.message ?? "Export complete");
      } else if (result.needsConnect) {
        connect();
        showAppErrorToast(result.error);
      } else {
        showAppErrorToast(result.error);
      }
    } finally {
      setBusy(false);
      onClose?.();
    }
  };

  return { items, sections, busy, connected, runExport };
}

export function ArtifactExportMenuItems({
  kind,
  payload,
  title,
  artifactId,
  onClose,
}: {
  kind: ArtifactKind;
  payload: ArtifactPayload;
  title: string;
  artifactId?: string;
  onClose?: () => void;
}) {
  const { sections, busy, connected, runExport } = useArtifactExportMenuActions({
    kind,
    payload,
    title,
    artifactId,
  });

  if (Object.keys(sections).length === 0) return null;

  return (
    <>
      {Object.entries(sections).map(([section, sectionItems]) => (
        <div key={section}>
          {section !== "default" && (
            <p className="px-3 pb-1 pt-2 text-canvas-micro font-medium uppercase tracking-wide text-canvas-muted">
              {sectionLabel(section)}
            </p>
          )}
          {sectionItems.map((item) => (
            <ContextMenuItem
              key={item.id}
              icon={exportMenuItemIcon(item)}
              label={item.label}
              disabled={busy || item.disabled}
              onClick={() => runExport(item, onClose)}
            />
          ))}
          {!connected && sectionItems.some((item) => item.kind === "google-sheets") ? (
            <p className="px-3 pb-1 text-canvas-micro text-canvas-accent">
              Connect Google Drive for Sheets export
            </p>
          ) : null}
        </div>
      ))}
    </>
  );
}
