"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { copyTextToClipboard } from "@/lib/artifactExport/clipboard";
import { COPY_KINDS, type CopyKey, type OutreachPodcaster } from "@/lib/outreach/podcasters";
import { OutreachModal } from "@/app/admin/outreach/OutreachModal";
import { patchPodcaster } from "@/app/admin/outreach/outreachApi";

export function CopyModal({
  podcaster,
  copyKey,
  onSaved,
  onClose,
}: {
  podcaster: OutreachPodcaster | null;
  copyKey: CopyKey | null;
  onSaved: (row: OutreachPodcaster) => void;
  onClose: () => void;
}) {
  const saved = podcaster && copyKey ? podcaster[copyKey] : "";
  const [text, setText] = useState(saved);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setText(saved);
    setError(null);
    setCopied(false);
  }, [podcaster?.id, copyKey, saved]);

  const dirty = text !== saved;
  const isOpen = podcaster !== null && copyKey !== null;
  const label = COPY_KINDS.find((k) => k.key === copyKey)?.label ?? "";

  const close = useCallback(() => {
    if (busy) return;
    if (dirty && !window.confirm("Discard your unsaved edits?")) return;
    onClose();
  }, [busy, dirty, onClose]);

  async function save() {
    if (!podcaster || !copyKey) return;
    setBusy(true);
    setError(null);
    try {
      onSaved(await patchPodcaster(podcaster.id, { [copyKey]: text }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (await copyTextToClipboard(text)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    }
  }

  return (
    <OutreachModal
      isOpen={isOpen}
      title={podcaster ? `${label} — ${podcaster.host_name}` : ""}
      onClose={close}
      widthClass="max-w-3xl"
      footer={
        <>
          {error ? (
            <span className="mr-auto text-canvas-body-sm text-canvas-danger">{error}</span>
          ) : dirty ? (
            <span className="mr-auto text-canvas-body-sm text-canvas-muted">Unsaved edits</span>
          ) : null}
          <Button variant="secondary" onClick={copy} disabled={!text}>
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button variant="primary" onClick={save} loading={busy} disabled={!dirty}>
            Save
          </Button>
        </>
      }
    >
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={`Write the ${label.toLowerCase()} for ${podcaster?.host_name ?? "this podcaster"}…`}
        className="h-[55vh] w-full resize-none rounded-canvas-md border border-canvas-border bg-canvas-bg p-4 text-canvas-body leading-relaxed text-canvas-ink outline-none focus:border-canvas-accent"
        autoFocus
      />
    </OutreachModal>
  );
}
