"use client";

import { useEffect, useRef, useState } from "react";
import {
  CanvasFloatingMenuPortal,
  useCanvasFloatingMenuPosition,
} from "@/components/CanvasFloatingMenu";
import { useArtifactExport } from "@/components/artifacts/ArtifactExportContext";
import { useGoogleConnection } from "@/hooks/useGoogleConnection";
import type { ArtifactKind, ArtifactPayload } from "@/lib/artifactTypes";
import { executeExportAction } from "@/lib/artifactExport/executeExport";
import { getExportMenuItems } from "@/lib/artifactExport/registry";
import type { ExportMenuItem } from "@/lib/artifactExport/types";
import { ARTIFACT_CANVAS_CHROME_OPACITY, ARTIFACT_CANVAS_CHROME_POINTER } from "@/lib/artifactCanvasChrome";

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className ?? "h-[22px] w-[22px]"} fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M8 2.5v7M8 9.5L5.5 7M8 9.5L10.5 7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 12.5h10" strokeLinecap="round" />
    </svg>
  );
}

export function ArtifactExportMenu({
  kind,
  payload,
  title,
  artifactId,
  menuVariant = "panel",
  onToast,
}: {
  kind: ArtifactKind;
  payload: ArtifactPayload;
  title: string;
  artifactId?: string;
  menuVariant?: "canvas" | "panel";
  onToast?: (message: string, isError?: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const isCanvas = menuVariant === "canvas";
  const { buildExportContext } = useArtifactExport();
  const { connected, connect } = useGoogleConnection();
  const menuPortal = useCanvasFloatingMenuPosition(open && isCanvas, buttonRef);

  const items = getExportMenuItems(kind, payload);
  const sections = groupBySection(items);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target)) return;
      if (menuPortal.portalRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, menuPortal.portalRef]);

  const runExport = async (item: ExportMenuItem) => {
    if (item.kind === "google-sheets" && !connected) {
      connect();
      onToast?.("Connect Google Drive to export to Sheets.");
      setOpen(false);
      return;
    }

    setBusy(true);
    try {
      const ctx = buildExportContext(kind, payload, title, artifactId);
      const result = await executeExportAction(ctx, item.kind, item.id);
      if (result.ok) {
        onToast?.(result.message ?? "Export complete");
      } else if (result.needsConnect) {
        connect();
        onToast?.(result.error, true);
      } else {
        onToast?.(result.error, true);
      }
    } finally {
      setBusy(false);
      setOpen(false);
    }
  };

  const chromeClass = isCanvas
    ? `${ARTIFACT_CANVAS_CHROME_OPACITY} ${ARTIFACT_CANVAS_CHROME_POINTER}`
    : "";
  const dropdownClass =
    "min-w-[220px] max-h-[min(420px,70vh)] overflow-y-auto rounded-canvas border border-canvas-border bg-canvas-card py-1 shadow-card";

  const menuContent = (
    <>
      {Object.entries(sections).map(([section, sectionItems]) => (
        <div key={section}>
          {section !== "default" && (
            <p className="px-3 pb-1 pt-2 text-canvas-micro font-medium uppercase tracking-wide text-canvas-muted">
              {sectionLabel(section)}
            </p>
          )}
          {sectionItems.map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={busy || item.disabled}
              onClick={() => runExport(item)}
              className="block w-full px-3 py-2 text-left text-canvas-body-sm text-canvas-ink hover:bg-canvas-bg disabled:opacity-50"
            >
              {item.label}
              {item.kind === "google-sheets" && !connected ? (
                <span className="mt-0.5 block text-canvas-micro text-canvas-accent">
                  Connect Google Drive
                </span>
              ) : null}
            </button>
          ))}
        </div>
      ))}
    </>
  );

  return (
    <div className={`relative shrink-0 ${chromeClass} ${open ? "opacity-100" : ""}`} ref={menuRef}>
      <button
        ref={buttonRef}
        type="button"
        aria-label="Export artifact"
        aria-expanded={open}
        disabled={busy}
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-canvas-muted transition-colors hover:bg-canvas-bg hover:text-canvas-ink disabled:opacity-50"
      >
        <DownloadIcon />
      </button>
      {open &&
        (isCanvas ? (
          <CanvasFloatingMenuPortal
            open={open}
            style={menuPortal.style}
            portalRef={menuPortal.portalRef}
            className={dropdownClass}
          >
            {menuContent}
          </CanvasFloatingMenuPortal>
        ) : (
          <div className={`absolute right-0 top-full z-50 mt-1 ${dropdownClass}`}>{menuContent}</div>
        ))}
    </div>
  );
}

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
