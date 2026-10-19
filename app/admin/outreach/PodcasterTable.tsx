"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, Pencil, Play, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { copyTextToClipboard } from "@/lib/artifactExport/clipboard";
import {
  COPY_KINDS,
  videoPublicUrl,
  type CopyKey,
  type OutreachPodcaster,
} from "@/lib/outreach/podcasters";
import { CopyModal } from "@/app/admin/outreach/CopyModal";
import { PodcasterFormModal } from "@/app/admin/outreach/PodcasterFormModal";
import { VideoModal } from "@/app/admin/outreach/VideoModal";

function useCopiedFlash() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  async function copy(id: string, text: string) {
    if (await copyTextToClipboard(text)) {
      setCopiedId(id);
      window.setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 1600);
    }
  }
  return { copiedId, copy };
}

const linkClass =
  "text-canvas-ink underline decoration-canvas-border underline-offset-4 hover:decoration-canvas-ink";
const actionClass =
  "text-canvas-body-sm font-medium text-canvas-accent hover:underline underline-offset-2 disabled:text-canvas-muted";

export function PodcasterTable({
  initialRows,
  loadError,
}: {
  initialRows: OutreachPodcaster[];
  loadError: string | null;
}) {
  const [rows, setRows] = useState(initialRows);
  const [video, setVideo] = useState<OutreachPodcaster | null>(null);
  const [copyTarget, setCopyTarget] = useState<{ id: string; key: CopyKey } | null>(null);
  // undefined = form closed, null = adding, row = editing.
  const [editing, setEditing] = useState<OutreachPodcaster | null | undefined>(undefined);
  const { copiedId, copy } = useCopiedFlash();

  const upsert = (row: OutreachPodcaster) =>
    setRows((cur) =>
      cur.some((r) => r.id === row.id) ? cur.map((r) => (r.id === row.id ? row : r)) : [...cur, row],
    );

  const copyRow = copyTarget ? (rows.find((r) => r.id === copyTarget.id) ?? null) : null;

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-6 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-canvas-body-sm text-canvas-muted">
          {rows.length} {rows.length === 1 ? "podcaster" : "podcasters"}
        </p>
        <Button variant="primary" icon={Plus} onClick={() => setEditing(null)}>
          Add podcaster
        </Button>
      </div>

      {loadError ? (
        <p className="rounded-canvas-md border border-canvas-dangerBorder p-3 text-canvas-body-sm text-canvas-danger">
          {loadError}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-canvas border border-canvas-border bg-canvas-card">
        <table className="w-full min-w-[64rem] border-collapse text-canvas-body-sm">
          <thead>
            <tr className="border-b border-canvas-border text-left text-canvas-micro uppercase tracking-wider text-canvas-muted">
              <th className="px-4 py-3 font-semibold">Podcaster</th>
              <th className="px-4 py-3 font-semibold">Podcast</th>
              <th className="px-4 py-3 font-semibold">Canvas</th>
              <th className="px-4 py-3 font-semibold">Showcase</th>
              {COPY_KINDS.map((k) => (
                <th key={k.key} className="px-4 py-3 font-semibold">
                  {k.short}
                </th>
              ))}
              <th className="px-4 py-3" aria-label="Edit" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-canvas-muted">
                  No podcasters yet. Add the first one.
                </td>
              </tr>
            ) : null}
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-canvas-border/50 last:border-0">
                <td className="px-4 py-3 font-medium text-canvas-ink">{row.host_name}</td>
                <td className="px-4 py-3">
                  {row.podcast_url ? (
                    <a href={row.podcast_url} target="_blank" rel="noreferrer" className={linkClass}>
                      {row.podcast_name}
                    </a>
                  ) : (
                    <span className="text-canvas-ink">{row.podcast_name}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {row.canvas_url ? (
                    <div className="flex items-center gap-1">
                      <a
                        href={row.canvas_url}
                        target="_blank"
                        rel="noreferrer"
                        className={`${actionClass} inline-flex items-center gap-1`}
                      >
                        Open <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      <IconButton
                        icon={copiedId === `${row.id}:canvas` ? Check : Copy}
                        label="Copy canvas link"
                        size="sm"
                        onClick={() => copy(`${row.id}:canvas`, row.canvas_url!)}
                      />
                    </div>
                  ) : (
                    <span className="text-canvas-muted">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {row.video_path ? (
                    <IconButton icon={Play} label="Play showcase video" onClick={() => setVideo(row)} />
                  ) : (
                    <button type="button" className={actionClass} onClick={() => setEditing(row)}>
                      Upload
                    </button>
                  )}
                </td>
                {COPY_KINDS.map((k) => {
                  const text = row[k.key];
                  const id = `${row.id}:${k.key}`;
                  return (
                    <td key={k.key} className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          className={actionClass}
                          onClick={() => setCopyTarget({ id: row.id, key: k.key })}
                        >
                          {text ? "View" : "Add"}
                        </button>
                        {text ? (
                          <button type="button" className={actionClass} onClick={() => copy(id, text)}>
                            {copiedId === id ? "Copied" : "Copy"}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  );
                })}
                <td className="px-4 py-3 text-right">
                  <IconButton icon={Pencil} label={`Edit ${row.host_name}`} size="sm" onClick={() => setEditing(row)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <VideoModal
        src={video?.video_path ? videoPublicUrl(video.video_path) : null}
        title={video ? `Showcase — ${video.podcast_name}` : ""}
        onClose={() => setVideo(null)}
      />
      <CopyModal
        podcaster={copyRow}
        copyKey={copyTarget?.key ?? null}
        onSaved={upsert}
        onClose={() => setCopyTarget(null)}
      />
      <PodcasterFormModal
        editing={editing}
        onSaved={(row) => {
          upsert(row);
          setEditing(undefined);
        }}
        onDeleted={(id) => {
          setRows((cur) => cur.filter((r) => r.id !== id));
          setEditing(undefined);
        }}
        onClose={() => setEditing(undefined)}
      />
    </div>
  );
}
