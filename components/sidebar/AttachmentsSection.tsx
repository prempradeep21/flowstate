"use client";

import { useRef } from "react";
import {
  fileToUploadedAttachment,
  groupUploadedAttachments,
  isAcceptedUploadMime,
} from "@/lib/attachments";
import { setSidebarDragData } from "@/lib/sidebarDnD";
import { useCanvasStore } from "@/lib/store";

function DraggableUploadRow({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  return (
    <div className="flex w-full items-center gap-1 rounded-lg px-1 py-0.5 hover:bg-canvas-bg">
      <div
        draggable
        onDragStart={(e) => {
          setSidebarDragData(e.dataTransfer, {
            kind: "upload",
            attachmentId: id,
          });
        }}
        className="flex min-w-0 flex-1 cursor-grab items-center px-1 py-1 text-[12px] text-canvas-ink active:cursor-grabbing"
      >
        <span className="truncate">{name}</span>
      </div>
      <button
        type="button"
        aria-label={`Remove ${name}`}
        onClick={() => {
          useCanvasStore.getState().removeUploadedAttachment(id);
        }}
        className="shrink-0 px-1 text-[11px] text-canvas-muted hover:text-canvas-ink"
      >
        ×
      </button>
    </div>
  );
}

export function AttachmentsSection() {
  const uploadedAttachments = useCanvasStore((s) => s.uploadedAttachments);
  const addUploadedAttachment = useCanvasStore((s) => s.addUploadedAttachment);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const groups = groupUploadedAttachments(uploadedAttachments);

  const ingestFiles = async (files: FileList | File[]) => {
    for (const file of Array.from(files)) {
      if (!isAcceptedUploadMime(file.type || "")) continue;
      const att = await fileToUploadedAttachment(file);
      if (att) addUploadedAttachment(att);
    }
  };

  return (
    <section className="px-3 py-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-[11px] font-medium uppercase tracking-wider text-canvas-muted">
          Uploaded attachments
        </h3>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-md border border-canvas-border px-2 py-0.5 text-[11px] font-medium text-canvas-ink hover:bg-canvas-bg"
        >
          Upload
        </button>
      </div>

      <div
        className="mb-2 rounded-lg border border-dashed border-canvas-border/80 px-2 py-3 text-center"
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes("Files")) {
            e.preventDefault();
          }
        }}
        onDrop={async (e) => {
          e.preventDefault();
          if (e.dataTransfer.files.length > 0) {
            await ingestFiles(e.dataTransfer.files);
          }
        }}
      >
        <p className="text-[11px] text-canvas-muted">
          Drop images or PDFs here
        </p>
      </div>

      <div className="space-y-3">
        {groups.map((group) => (
          <div key={group.category}>
            <div className="mb-1 text-[11px] font-medium text-canvas-muted/90">
              {group.label}
            </div>
            {group.items.length === 0 ? (
              <p className="px-2 py-1 text-[11px] text-canvas-muted/80">
                None yet
              </p>
            ) : (
              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <DraggableUploadRow id={item.id} name={item.name} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
        multiple
        className="hidden"
        onChange={async (e) => {
          if (e.target.files) await ingestFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </section>
  );
}
