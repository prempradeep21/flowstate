"use client";

import { ArtifactContentStage } from "@/components/artifacts/ArtifactContentStage";
import { GoogleWorkspaceConnectMenu } from "@/components/google/GoogleWorkspaceConnectMenu";
import type { ArtifactPayload } from "@/lib/artifactTypes";
import {
  googleWorkspaceFileKindLabel,
  isGoogleWorkspaceTitlePending,
} from "@/lib/googleWorkspaceArtifact";
import { useGoogleConnection } from "@/hooks/useGoogleConnection";
import { useGooglePicker } from "@/hooks/useGooglePicker";
import { useCanvasStore } from "@/lib/store";

function GoogleWorkspaceBrandIcon({
  fileKind,
  className,
}: {
  fileKind: Extract<
    ArtifactPayload,
    { type: "google-doc" }
  >["data"]["fileKind"];
  className?: string;
}) {
  const base = className ?? "h-10 w-10";
  if (fileKind === "spreadsheet") {
    return (
      <svg viewBox="0 0 48 48" className={base} aria-hidden>
        <path fill="#188038" d="M11 4h18l8 8v32H11V4z" />
        <path fill="#fff" fillOpacity=".25" d="M29 4v8h8" />
        <rect x="16" y="22" width="16" height="2.5" rx="1" fill="#fff" />
        <rect x="16" y="28" width="16" height="2.5" rx="1" fill="#fff" />
        <rect x="16" y="34" width="10" height="2.5" rx="1" fill="#fff" />
      </svg>
    );
  }
  if (fileKind === "presentation") {
    return (
      <svg viewBox="0 0 48 48" className={base} aria-hidden>
        <path fill="#F4B400" d="M11 4h18l8 8v32H11V4z" />
        <path fill="#fff" fillOpacity=".25" d="M29 4v8h8" />
        <rect x="15" y="24" width="18" height="12" rx="1.5" fill="#fff" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 48 48" className={base} aria-hidden>
      <path fill="#4285F4" d="M11 4h18l8 8v32H11V4z" />
      <path fill="#fff" fillOpacity=".25" d="M29 4v8h8" />
      <rect x="16" y="22" width="16" height="2.5" rx="1" fill="#fff" />
      <rect x="16" y="27" width="16" height="2.5" rx="1" fill="#fff" />
      <rect x="16" y="32" width="12" height="2.5" rx="1" fill="#fff" />
    </svg>
  );
}

function statusMessage(
  payload: Extract<ArtifactPayload, { type: "google-doc" }>,
): string | null {
  switch (payload.data.status) {
    case "loading":
      return "Importing content…";
    case "needs_connect":
      return "Connect Google Drive to import this file.";
    case "needs_access":
      return "Choose this file in Google Drive to grant access.";
    case "failed":
      return payload.data.errorMessage ?? "Could not import this file.";
    case "ready":
      if (payload.data.extractedText?.trim()) {
        const chars =
          payload.data.extractedTextLength ??
          payload.data.extractedText.length;
        return payload.data.truncated
          ? `${chars.toLocaleString()} characters imported (truncated for context)`
          : `${chars.toLocaleString()} characters ready for AI context`;
      }
      return "Linked — open in Google to view the live document.";
    default:
      return null;
  }
}

export function GoogleWorkspaceArtifactContent({
  payload,
  fill = false,
  sidebar = false,
  artifactId,
}: {
  payload: Extract<ArtifactPayload, { type: "google-doc" }>;
  fill?: boolean;
  sidebar?: boolean;
  artifactId?: string;
}) {
  const { connect, connected, signedIn } = useGoogleConnection();
  const { openPicker, busy: pickerBusy } = useGooglePicker();
  const patch = useCanvasStore((s) => s.patchGoogleWorkspaceArtifact);
  const pending = isGoogleWorkspaceTitlePending(payload);
  const { url, title, fileKind, status, extractedText } = payload.data;
  const message = statusMessage(payload);

  const retryImport = async (fileId: string, docUrl: string) => {
    if (!artifactId) return;
    patch(artifactId, { status: "loading", errorMessage: undefined });
    try {
      const params = new URLSearchParams({ url: docUrl, fileId });
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
          errorMessage: "Connect Google Drive to import this file.",
        });
        return;
      }
      if (body.needsAccess) {
        patch(artifactId, {
          status: "needs_access",
          errorMessage:
            "Choose this file in Google Drive to grant access, then try again.",
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
  };

  const handleGrantAccess = () => {
    void openPicker((doc) => {
      if (!artifactId) return;
      const docUrl =
        doc.url ?? `https://drive.google.com/file/d/${doc.id}/view`;
      void retryImport(doc.id, docUrl);
    });
  };

  const body = (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-start gap-3">
        <GoogleWorkspaceBrandIcon fileKind={fileKind} className="h-11 w-11 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-canvas-micro font-medium uppercase tracking-wide text-canvas-muted">
            {googleWorkspaceFileKindLabel(fileKind)}
          </p>
          <h3
            className={`mt-0.5 text-canvas-body font-semibold leading-snug ${
              pending ? "text-canvas-muted" : "text-canvas-ink"
            }`}
          >
            {title}
          </h3>
          {message ? (
            <p className="mt-1 text-canvas-caption text-canvas-muted">{message}</p>
          ) : null}
        </div>
      </div>

      {status === "ready" && extractedText?.trim() ? (
        <div className="max-h-40 overflow-hidden rounded-canvas border border-canvas-border/60 bg-canvas-bg/80">
          <pre className="max-h-40 overflow-auto whitespace-pre-wrap p-3 text-canvas-caption text-canvas-ink/90">
            {extractedText.slice(0, 1200)}
            {extractedText.length > 1200 ? "…" : ""}
          </pre>
        </div>
      ) : null}

      {(status === "needs_connect" || status === "needs_access" || status === "failed") &&
      artifactId ? (
        <div className="flex flex-wrap items-center gap-2">
          {(status === "needs_connect" || !connected) && signedIn ? (
            <button
              type="button"
              data-no-drag
              onClick={() =>
                connect({ intent: "picker", artifactId })
              }
              className="rounded-full border border-canvas-ink/20 px-3 py-1.5 text-canvas-compact text-canvas-ink hover:bg-canvas-bg"
            >
              Connect Google Drive
            </button>
          ) : null}
          {status === "needs_access" || status === "failed" ? (
            <button
              type="button"
              data-no-drag
              disabled={pickerBusy || !connected}
              onClick={handleGrantAccess}
              className="rounded-full border border-canvas-ink/20 px-3 py-1.5 text-canvas-compact text-canvas-ink hover:bg-canvas-bg disabled:opacity-50"
            >
              Choose in Google Drive
            </button>
          ) : null}
          {connected ? (
            <button
              type="button"
              data-no-drag
              onClick={() => void retryImport(payload.data.fileId, url)}
              className="rounded-full px-3 py-1.5 text-canvas-compact text-canvas-muted hover:bg-canvas-bg hover:text-canvas-ink"
            >
              Retry import
            </button>
          ) : null}
        </div>
      ) : null}

      {!sidebar && signedIn && status !== "needs_connect" ? (
        <div className="flex justify-end">
          <GoogleWorkspaceConnectMenu />
        </div>
      ) : null}
    </div>
  );

  if (sidebar) {
    return (
      <div className="flex h-full min-h-[80px] items-center gap-2 px-3 py-2">
        <GoogleWorkspaceBrandIcon fileKind={fileKind} className="h-9 w-9 shrink-0" />
        <div className="min-w-0 flex-1">
          <span
            className={`block truncate text-canvas-caption font-medium ${
              pending ? "text-canvas-muted" : "text-canvas-ink"
            }`}
          >
            {title}
          </span>
          <span className="mt-0.5 block truncate text-canvas-micro text-canvas-muted">
            {googleWorkspaceFileKindLabel(fileKind)}
          </span>
        </div>
      </div>
    );
  }

  if (fill) {
    return (
      <ArtifactContentStage fill className="h-full !bg-transparent">
        <div className="flex h-full min-h-0 flex-col overflow-auto">{body}</div>
      </ArtifactContentStage>
    );
  }

  return body;
}
