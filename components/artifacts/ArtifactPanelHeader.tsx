"use client";

import { useEffect, useRef, useState } from "react";
import { ArtifactTypeIcon } from "@/components/artifacts/ArtifactTypeIcon";
import type { ArtifactKind } from "@/lib/artifactTypes";
import type { ArtifactVersion } from "@/lib/sessionArtifacts";

export function ArtifactPanelHeader({
  kind,
  title,
  versions,
  activeVersionId,
  onVersionChange,
}: {
  kind: ArtifactKind;
  title: string;
  versions: ArtifactVersion[];
  activeVersionId: string;
  onVersionChange: (versionId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const active = versions.find((v) => v.id === activeVersionId) ?? versions[versions.length - 1];

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div className="flex h-10 items-center gap-2">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-canvas-artifactIconBg text-canvas-ink">
        <ArtifactTypeIcon kind={kind} />
      </span>
      <h2 className="min-w-0 flex-1 truncate text-[15px] font-semibold leading-tight text-canvas-ink">
        {title}
      </h2>
      <div className="relative shrink-0" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex h-8 items-center gap-1 rounded-full border border-canvas-ink/20 px-3 text-[13px] font-medium text-canvas-ink transition-colors hover:bg-canvas-bg"
        >
          Version {active?.number ?? 1}
          <span className="text-[10px] opacity-70" aria-hidden>
            ⌵
          </span>
        </button>
        {open && (
          <div className="absolute right-0 top-full z-50 mt-1 min-w-[140px] overflow-hidden rounded-xl border border-canvas-border bg-canvas-card py-1 shadow-card">
            {[...versions].reverse().map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => {
                  onVersionChange(v.id);
                  setOpen(false);
                }}
                className={`block w-full px-3 py-2 text-left text-[13px] ${
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
      <button
        type="button"
        aria-label="More options"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-canvas-muted transition-colors hover:bg-canvas-bg hover:text-canvas-ink"
      >
        <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor" aria-hidden>
          <circle cx="8" cy="3.5" r="1.25" />
          <circle cx="8" cy="8" r="1.25" />
          <circle cx="8" cy="12.5" r="1.25" />
        </svg>
      </button>
    </div>
  );
}
