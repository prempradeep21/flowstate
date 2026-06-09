"use client";

import type { PreviewData } from "@/lib/github/types";
import { WidgetCard } from "@/components/repo-explorer/WidgetCard";

export function PreviewWidget({ data }: { data?: PreviewData }) {
  if (!data) return null;

  const canEmbed =
    data.previewAvailable &&
    data.previewUrl &&
    data.confidence >= 0.7 &&
    !/github\.com/i.test(data.previewUrl);

  return (
    <WidgetCard
      title="Preview"
      subtitle={(data.previewType ?? "no-preview").replace(/-/g, " ")}
    >
      {!data.previewAvailable || !data.previewUrl ? (
        <div className="flex flex-1 flex-col justify-center gap-2 text-canvas-body-sm text-canvas-muted">
          <p>No live demo URL detected in README or homepage.</p>
          <p className="text-canvas-compact">
            This project is primarily CLI / agent-installed — try the install commands in Tech
            Details.
          </p>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2 text-canvas-compact">
            {data.deploymentProvider ? (
              <span className="rounded-full bg-canvas-artifactStage px-2 py-0.5 text-canvas-muted">
                {data.deploymentProvider}
              </span>
            ) : null}
            <span className="text-canvas-muted">
              Confidence {Math.round((data.confidence ?? 0) * 100)}%
            </span>
          </div>

          {canEmbed ? (
            <div className="min-h-[180px] flex-1 overflow-hidden rounded-canvas border border-canvas-border bg-canvas-artifactStage">
              <iframe
                src={data.previewUrl}
                title="Live preview"
                className="h-full min-h-[180px] w-full"
                sandbox="allow-scripts allow-same-origin allow-popups"
              />
            </div>
          ) : (
            <a
              href={data.previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-canvas bg-canvas-accent px-3 py-2 text-canvas-body-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              Open preview
              <span aria-hidden>↗</span>
            </a>
          )}
        </div>
      )}
    </WidgetCard>
  );
}
