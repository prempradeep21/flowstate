"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArtifactContentStage } from "@/components/artifacts/ArtifactContentStage";
import { ArtifactTypeIcon } from "@/components/artifacts/ArtifactTypeIcon";
import { GoogleWorkspaceConnectMenu } from "@/components/google/GoogleWorkspaceConnectMenu";
import type { ArtifactPayload } from "@/lib/artifactTypes";
import { isGoogleWorkspaceTitlePending } from "@/lib/googleWorkspaceArtifact";
import { googleWorkspacePreviewUrl } from "@/lib/google/workspacePreviewUrl";
import { useGoogleConnection } from "@/hooks/useGoogleConnection";
import { useGooglePicker } from "@/hooks/useGooglePicker";
import { useCanvasStore } from "@/lib/store";

function parseCsvPreview(csv: string, maxRows: number): string[][] {
  const rows: string[][] = [];
  for (const line of csv.split(/\r?\n/)) {
    if (!line.trim()) continue;
    rows.push(line.split(",").map((cell) => cell.trim()));
    if (rows.length >= maxRows) break;
  }
  return rows;
}

function ExtractedContentPreview({
  fileKind,
  extractedText,
}: {
  fileKind: Extract<
    ArtifactPayload,
    { type: "google-doc" }
  >["data"]["fileKind"];
  extractedText: string;
}) {
  if (fileKind === "spreadsheet") {
    const rows = parseCsvPreview(extractedText, 8);
    if (rows.length === 0) return null;
    const colCount = Math.max(...rows.map((r) => r.length));
    return (
      <div className="overflow-hidden rounded-canvas border border-canvas-border/60 bg-canvas-card">
        <table className="w-full border-collapse text-left text-canvas-micro text-canvas-ink">
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={
                  rowIndex === 0
                    ? "bg-canvas-bg/80 font-medium"
                    : "border-t border-canvas-border/40"
                }
              >
                {Array.from({ length: colCount }, (_, colIndex) => (
                  <td
                    key={colIndex}
                    className="max-w-[120px] truncate px-2 py-1.5 align-top"
                  >
                    {row[colIndex] ?? ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-canvas border border-canvas-border/60 bg-canvas-bg/80">
      <pre className="max-h-48 overflow-auto whitespace-pre-wrap p-3 text-canvas-caption leading-relaxed text-canvas-ink/90">
        {extractedText.slice(0, 1600)}
        {extractedText.length > 1600 ? "…" : ""}
      </pre>
    </div>
  );
}

function GoogleWorkspacePreviewFrame({
  previewUrl,
  title,
  interactive,
  onActivate,
}: {
  previewUrl: string;
  title: string;
  interactive: boolean;
  onActivate?: () => void;
}) {
  return (
    <div className="relative flex h-full min-h-[200px] w-full flex-col overflow-hidden bg-canvas-bg">
      <iframe
        src={previewUrl}
        title={title}
        className={`h-full w-full flex-1 border-0 bg-white ${
          interactive ? "pointer-events-auto" : "pointer-events-none"
        }`}
        allow="autoplay; fullscreen; clipboard-write"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
      {!interactive && onActivate ? (
        <button
          type="button"
          aria-label="Click to interact with document"
          onClick={onActivate}
          className="absolute inset-0 z-10 flex cursor-pointer items-end justify-center bg-transparent pb-3 opacity-0 transition-opacity hover:opacity-100 focus-visible:opacity-100"
        >
          <span className="rounded-full border border-canvas-border/60 bg-canvas-card/95 px-2.5 py-1 text-canvas-micro text-canvas-muted shadow-sm">
            Click to interact
          </span>
        </button>
      ) : null}
    </div>
  );
}

function ImportStatusBanner({
  status,
  message,
  connected,
  signedIn,
  pickerBusy,
  onConnect,
  onGrantAccess,
  onRetry,
}: {
  status: Extract<
    ArtifactPayload,
    { type: "google-doc" }
  >["data"]["status"];
  message: string | null;
  connected: boolean;
  signedIn: boolean;
  pickerBusy: boolean;
  onConnect: () => void;
  onGrantAccess: () => void;
  onRetry: () => void;
}) {
  if (status === "ready" || status === "loading") return null;
  if (!message) return null;

  return (
    <div className="shrink-0 border-t border-canvas-border/50 bg-canvas-card/95 px-3 py-2">
      <p className="text-canvas-micro text-canvas-muted">{message}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {status === "needs_connect" && signedIn ? (
          <button
            type="button"
            data-no-drag
            onClick={onConnect}
            className="rounded-full border border-canvas-ink/20 px-2.5 py-1 text-canvas-micro text-canvas-ink hover:bg-canvas-bg"
          >
            Connect Google Drive
          </button>
        ) : null}
        {status === "needs_access" ? (
          <button
            type="button"
            data-no-drag
            disabled={pickerBusy || !connected}
            onClick={onGrantAccess}
            className="rounded-full border border-canvas-ink/20 px-2.5 py-1 text-canvas-micro text-canvas-ink hover:bg-canvas-bg disabled:opacity-50"
          >
            Grant access for AI
          </button>
        ) : null}
        {(status === "needs_access" || status === "failed") && connected ? (
          <button
            type="button"
            data-no-drag
            onClick={onRetry}
            className="rounded-full px-2.5 py-1 text-canvas-micro text-canvas-muted hover:bg-canvas-bg hover:text-canvas-ink"
          >
            Retry import
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function GoogleWorkspaceArtifactContent({
  payload,
  fill = false,
  sidebar = false,
  layout = "panel",
  artifactId,
  forceInteractive = false,
}: {
  payload: Extract<ArtifactPayload, { type: "google-doc" }>;
  fill?: boolean;
  sidebar?: boolean;
  layout?: "canvas" | "panel" | "sidebar";
  artifactId?: string;
  forceInteractive?: boolean;
}) {
  const { connect, connected, signedIn } = useGoogleConnection();
  const { openPicker, busy: pickerBusy } = useGooglePicker();
  const patch = useCanvasStore((s) => s.patchGoogleWorkspaceArtifact);
  const pending = isGoogleWorkspaceTitlePending(payload);
  const { url, title, fileKind, fileId, status, extractedText } = payload.data;
  const previewUrl = googleWorkspacePreviewUrl(fileId, fileKind);
  const isCanvas = layout === "canvas";
  const [active, setActive] = useState(forceInteractive);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActive(forceInteractive);
  }, [forceInteractive]);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(false);
    };
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setActive(false);
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [active]);

  const interactive = isCanvas && active;
  const importMessage =
    status === "loading"
      ? "Importing text for AI context…"
      : status === "needs_connect"
        ? "Connect Google Drive to import text for AI context."
        : status === "needs_access"
          ? "Preview is live. Grant Drive access to import text for AI."
          : status === "failed"
            ? (payload.data.errorMessage ?? "Could not import text for AI context.")
            : null;

  const retryImport = useCallback(
    async (targetFileId: string, docUrl: string) => {
      if (!artifactId) return;
      patch(artifactId, { status: "loading", errorMessage: undefined });
      try {
        const params = new URLSearchParams({ url: docUrl, fileId: targetFileId });
        const res = await fetch(`/api/google/files?${params.toString()}`);
        const body = (await res.json()) as {
          needsConnect?: boolean;
          needsAccess?: boolean;
          error?: string;
          title?: string;
          mimeType?: string;
          extractedText?: string;
          extractedTextLength?: number;
          truncated?: boolean;
        };
        if (body.needsConnect) {
          patch(artifactId, {
            status: "needs_connect",
            errorMessage: "Connect Google Drive to import text for AI context.",
          });
          return;
        }
        if (body.needsAccess) {
          patch(artifactId, {
            status: "needs_access",
            errorMessage:
              "Grant Drive access to import text for AI context.",
          });
          return;
        }
        if (!res.ok) {
          patch(artifactId, {
            status: "failed",
            errorMessage: body.error ?? "Import failed",
          });
          return;
        }
        patch(artifactId, {
          title: body.title,
          mimeType: body.mimeType,
          status: "ready",
          extractedText: body.extractedText,
          extractedTextLength:
            body.extractedTextLength ?? body.extractedText?.length,
          truncated: body.truncated,
          errorMessage: undefined,
        });
      } catch {
        patch(artifactId, {
          status: "failed",
          errorMessage: "Import failed",
        });
      }
    },
    [artifactId, patch],
  );

  const handleGrantAccess = useCallback(() => {
    void openPicker((doc) => {
      if (!artifactId) return;
      const docUrl =
        doc.url ?? `https://drive.google.com/file/d/${doc.id}/view`;
      void retryImport(doc.id, docUrl);
    });
  }, [artifactId, openPicker, retryImport]);

  const handleRetry = useCallback(() => {
    void retryImport(fileId, url);
  }, [fileId, retryImport, url]);

  if (sidebar) {
    return (
      <div className="flex h-full min-h-[80px] items-center gap-2 px-3 py-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-canvas bg-canvas-bg">
          <ArtifactTypeIcon
            kind="google-doc"
            googleFileKind={fileKind}
            className="h-5 w-5"
          />
        </span>
        <div className="min-w-0 flex-1">
          <span
            className={`block truncate text-canvas-caption font-medium ${
              pending ? "text-canvas-muted" : "text-canvas-ink"
            }`}
          >
            {title}
          </span>
        </div>
      </div>
    );
  }

  const preview = (
    <div ref={rootRef} className="flex h-full min-h-0 flex-col">
      <div className="relative min-h-0 flex-1">
        <GoogleWorkspacePreviewFrame
          previewUrl={previewUrl}
          title={title}
          interactive={interactive || !isCanvas}
          onActivate={isCanvas ? () => setActive(true) : undefined}
        />
        {status === "loading" ? (
          <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 rounded-full border border-canvas-border/50 bg-canvas-card/95 px-2.5 py-1 text-canvas-micro text-canvas-muted shadow-sm">
            <span className="h-3 w-3 animate-spin rounded-full border border-canvas-border border-t-canvas-accent" />
            Importing…
          </div>
        ) : null}
      </div>
      {status === "ready" &&
      extractedText?.trim() &&
      !fill &&
      fileKind !== "presentation" ? (
        <div className="shrink-0 p-3">
          <ExtractedContentPreview
            fileKind={fileKind}
            extractedText={extractedText}
          />
        </div>
      ) : null}
      {artifactId ? (
        <ImportStatusBanner
          status={status}
          message={importMessage}
          connected={connected}
          signedIn={signedIn}
          pickerBusy={pickerBusy}
          onConnect={() => connect({ intent: "picker", artifactId })}
          onGrantAccess={handleGrantAccess}
          onRetry={handleRetry}
        />
      ) : null}
      {!sidebar && signedIn && status !== "needs_connect" && !fill ? (
        <div className="flex justify-end px-3 pb-3">
          <GoogleWorkspaceConnectMenu />
        </div>
      ) : null}
    </div>
  );

  if (fill) {
    return (
      <ArtifactContentStage
        fill
        artifactId={artifactId}
        showControls={!sidebar}
        className="h-full min-h-0 !bg-transparent"
      >
        {preview}
      </ArtifactContentStage>
    );
  }

  return preview;
}
