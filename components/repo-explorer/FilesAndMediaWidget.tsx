"use client";

import type { FileStructureData, MediaData } from "@/lib/github/types";
import { MediaGallery } from "@/components/repo-explorer/MediaWidget";
import { StatPill, WidgetCard } from "@/components/repo-explorer/WidgetCard";

export function FilesAndMediaWidget({
  files,
  media,
}: {
  files?: FileStructureData;
  media?: MediaData;
}) {
  if (!files && !media) return null;

  const maxCount = files?.extensionCounts[0]?.count ?? 1;
  const hasGallery = (media?.displayableItems?.length ?? 0) > 0;

  return (
    <WidgetCard
      title="Files & media"
      subtitle={
        files?.truncated
          ? "Partial tree · large README screenshots only"
          : "Repository tree · large README screenshots only"
      }
    >
      <div className="space-y-4">
        {files ? (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-2">
              <StatPill label="Files" value={files.totalFiles.toLocaleString()} />
              <StatPill label="Folders" value={files.totalFolders.toLocaleString()} />
              <StatPill label="Entries" value={files.totalEntries.toLocaleString()} />
            </div>

            {files.extensionCounts.length > 0 ? (
              <div>
                <h3 className="mb-2 text-canvas-caption uppercase tracking-wide text-canvas-muted">
                  By extension
                </h3>
                <ul className="space-y-1.5">
                  {files.extensionCounts.map((row) => (
                    <li key={row.extension} className="flex items-center gap-2">
                      <span className="w-24 shrink-0 truncate text-canvas-compact font-medium text-canvas-ink">
                        {row.label}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div
                          className="h-2 rounded-full bg-canvas-accent/80"
                          style={{
                            width: `${Math.max(8, (row.count / maxCount) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="w-10 shrink-0 text-right text-canvas-compact tabular-nums text-canvas-muted">
                        {row.count}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {files.topLevelFolders.length > 0 ? (
              <div>
                <h3 className="mb-2 text-canvas-caption uppercase tracking-wide text-canvas-muted">
                  Top-level folders
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {files.topLevelFolders.map((folder) => (
                    <span
                      key={folder}
                      className="inline-flex items-center rounded-canvas-sm bg-canvas-artifactStage px-2 py-1 font-mono text-canvas-compact text-canvas-ink"
                    >
                      {folder}/
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {hasGallery && media ? (
          <div className={files ? "border-t border-canvas-border pt-4" : ""}>
            <h3 className="mb-2 text-canvas-caption uppercase tracking-wide text-canvas-muted">
              README media
            </h3>
            <MediaGallery data={media} />
          </div>
        ) : null}
      </div>
    </WidgetCard>
  );
}
