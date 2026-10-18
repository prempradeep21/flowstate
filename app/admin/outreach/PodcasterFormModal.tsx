"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { OutreachPodcaster } from "@/lib/outreach/podcasters";
import { OutreachModal } from "@/app/admin/outreach/OutreachModal";
import {
  createPodcaster,
  deletePodcaster,
  patchPodcaster,
  uploadShowcaseVideo,
} from "@/app/admin/outreach/outreachApi";

type FormState = {
  host_name: string;
  podcast_name: string;
  podcast_url: string;
  canvas_url: string;
};

const EMPTY: FormState = { host_name: "", podcast_name: "", podcast_url: "", canvas_url: "" };

/**
 * Add or edit one podcaster. `editing === undefined` means closed, `null`
 * means adding, a row means editing that row.
 */
export function PodcasterFormModal({
  editing,
  onSaved,
  onDeleted,
  onClose,
}: {
  editing: OutreachPodcaster | null | undefined;
  onSaved: (row: OutreachPodcaster) => void;
  onDeleted: (id: string) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState<"save" | "delete" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editing === undefined) return;
    setForm(
      editing
        ? {
            host_name: editing.host_name,
            podcast_name: editing.podcast_name,
            podcast_url: editing.podcast_url ?? "",
            canvas_url: editing.canvas_url ?? "",
          }
        : EMPTY,
    );
    setFile(null);
    setError(null);
  }, [editing]);

  const isOpen = editing !== undefined;
  const close = () => {
    if (!busy) onClose();
  };

  async function save() {
    if (!form.host_name.trim() || !form.podcast_name.trim()) {
      setError("Podcaster and podcast name are required.");
      return;
    }
    setBusy("save");
    setError(null);
    try {
      const patch = {
        host_name: form.host_name.trim(),
        podcast_name: form.podcast_name.trim(),
        podcast_url: form.podcast_url.trim() || null,
        canvas_url: form.canvas_url.trim() || null,
        ...(file ? { video_path: await uploadShowcaseVideo(file) } : {}),
      };
      onSaved(editing ? await patchPodcaster(editing.id, patch) : await createPodcaster(patch));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!editing) return;
    if (!window.confirm(`Delete ${editing.host_name} and all their copies?`)) return;
    setBusy("delete");
    setError(null);
    try {
      await deletePodcaster(editing.id);
      onDeleted(editing.id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const field = (key: keyof FormState, label: string, placeholder: string) => (
    <label className="flex flex-col gap-1.5">
      <span className="text-canvas-micro font-semibold uppercase tracking-wider text-canvas-muted">
        {label}
      </span>
      <input
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        className="h-9 rounded-canvas-md border border-canvas-border bg-canvas-bg px-3 text-canvas-body-sm text-canvas-ink outline-none focus:border-canvas-accent"
      />
    </label>
  );

  return (
    <OutreachModal
      isOpen={isOpen}
      title={editing ? `Edit ${editing.host_name}` : "Add podcaster"}
      onClose={close}
      widthClass="max-w-lg"
      footer={
        <>
          {editing ? (
            <Button
              variant="ghost"
              tone="danger"
              className="mr-auto"
              onClick={remove}
              loading={busy === "delete"}
              disabled={busy !== null}
            >
              Delete
            </Button>
          ) : null}
          <Button variant="ghost" onClick={close} disabled={busy !== null}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={save}
            loading={busy === "save"}
            disabled={busy !== null}
          >
            {busy === "save" && file ? "Uploading…" : editing ? "Save" : "Add"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {field("host_name", "Podcaster", "Vishnu Kondur")}
        {field("podcast_name", "Podcast", "Jagadamba Theatre — Rooted Stories")}
        {field("podcast_url", "Podcast link", "https://www.youtube.com/watch?v=…")}
        {field("canvas_url", "Flowstate canvas link", "https://flowstatetool.com/c/…")}
        <label className="flex flex-col gap-1.5">
          <span className="text-canvas-micro font-semibold uppercase tracking-wider text-canvas-muted">
            Showcase video{editing?.video_path ? " (replace)" : ""}
          </span>
          <input
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-canvas-body-sm text-canvas-muted file:mr-3 file:rounded-canvas-md file:border file:border-canvas-border file:bg-canvas-card file:px-3 file:py-1.5 file:text-canvas-ink"
          />
          <span className="text-canvas-body-sm text-canvas-muted">
            mp4, webm or mov, up to 50 MB.
          </span>
        </label>
        {error ? <p className="text-canvas-body-sm text-canvas-danger">{error}</p> : null}
      </div>
    </OutreachModal>
  );
}
