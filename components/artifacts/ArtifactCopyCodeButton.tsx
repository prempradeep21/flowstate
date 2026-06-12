"use client";

import { useEffect, useRef, useState } from "react";
import {
  CanvasFloatingMenuPortal,
  useCanvasFloatingMenuPosition,
} from "@/components/CanvasFloatingMenu";
import { useArtifactExport } from "@/components/artifacts/ArtifactExportContext";
import type { ArtifactKind, ArtifactPayload } from "@/lib/artifactTypes";
import { showAppErrorToast, showAppToast } from "@/lib/appToastStore";
import { copyTextToClipboard } from "@/lib/artifactExport/clipboard";
import {
  generateCodeVariant,
  getCodeVariants,
} from "@/lib/artifactExport/codeGenerators";
import type { CodeVariant } from "@/lib/artifactExport/types";
import { ARTIFACT_CANVAS_CHROME_OPACITY, ARTIFACT_CANVAS_CHROME_POINTER } from "@/lib/artifactCanvasChrome";

function CodeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className ?? "h-[22px] w-[22px]"} fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M5.5 5L2.5 8l3 3M10.5 5l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className ?? "h-[22px] w-[22px]"} fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <rect x="5.5" y="5.5" width="7" height="7" rx="1" />
      <path d="M5.5 10.5H4.5a1 1 0 01-1-1v-7a1 1 0 011-1h7a1 1 0 011 1v1" strokeLinecap="round" />
    </svg>
  );
}

export function ArtifactCopyCodeButton({
  kind,
  payload,
  title,
  artifactId,
  menuVariant = "panel",
}: {
  kind: ArtifactKind;
  payload: ArtifactPayload;
  title: string;
  artifactId?: string;
  menuVariant?: "canvas" | "panel";
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const isCanvas = menuVariant === "canvas";
  const { buildExportContext } = useArtifactExport();
  const menuPortal = useCanvasFloatingMenuPosition(open && isCanvas, buttonRef);
  const variants = getCodeVariants(kind, payload);

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

  const copyVariant = async (variant: CodeVariant) => {
    const ctx = buildExportContext(kind, payload, title, artifactId);
    const text = generateCodeVariant(ctx, variant.id);
    const ok = await copyTextToClipboard(text);
    if (ok) {
      showAppToast(`Copied ${variant.label}`);
    } else {
      showAppErrorToast("Copy failed");
    }
    setOpen(false);
  };

  const chromeClass = isCanvas
    ? `${ARTIFACT_CANVAS_CHROME_OPACITY} ${ARTIFACT_CANVAS_CHROME_POINTER}`
    : "";
  const dropdownClass =
    "min-w-[160px] overflow-hidden rounded-canvas border border-canvas-border bg-canvas-card py-1 shadow-card";

  const menuContent = variants.map((variant) => (
    <button
      key={variant.id}
      type="button"
      onClick={() => copyVariant(variant)}
      className="block w-full px-3 py-2 text-left text-canvas-body-sm text-canvas-ink hover:bg-canvas-bg"
    >
      {variant.label}
    </button>
  ));

  return (
    <div className={`relative shrink-0 ${chromeClass} ${open ? "opacity-100" : ""}`} ref={menuRef}>
      <button
        ref={buttonRef}
        type="button"
        aria-label="Copy as code"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-canvas-muted transition-colors hover:bg-canvas-bg hover:text-canvas-ink"
      >
        <CodeIcon />
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

export function ArtifactCodeCopyButton({
  menuVariant = "panel",
}: {
  menuVariant?: "canvas" | "panel";
}) {
  const exportCtx = useArtifactExport();
  const isCanvas = menuVariant === "canvas";
  const chromeClass = isCanvas
    ? `${ARTIFACT_CANVAS_CHROME_OPACITY} ${ARTIFACT_CANVAS_CHROME_POINTER}`
    : "";

  const handleCopy = async () => {
    const content = exportCtx.buildExportContext(
      "code",
      { type: "code", title: "", data: { files: [] } },
      "",
    ).codeActiveContent;
    if (!content) {
      showAppErrorToast("No code to copy");
      return;
    }
    const ok = await copyTextToClipboard(content);
    if (ok) {
      showAppToast("Copied code");
    } else {
      showAppErrorToast("Copy failed");
    }
  };

  return (
    <button
      type="button"
      aria-label="Copy code"
      onClick={handleCopy}
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-canvas-muted transition-colors hover:bg-canvas-bg hover:text-canvas-ink ${chromeClass}`}
    >
      <CopyIcon />
    </button>
  );
}
