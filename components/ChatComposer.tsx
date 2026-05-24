"use client";

import {
  KeyboardEvent,
  useRef,
  useState,
} from "react";
import { ArtifactAttachmentPill } from "@/components/artifacts/ArtifactAttachmentPill";
import {
  artifactDisplayTitle,
  getLatestVersion,
  getVersionById,
} from "@/lib/sessionArtifacts";
import { useSidebarDropTarget } from "@/hooks/useSidebarDropTarget";
import { useAutoResizeTextarea } from "@/lib/useAutoResizeTextarea";
import {
  AttachedArtifactRef,
  CardImage,
  FollowUpOptions,
  PendingFileAttachment,
  useCanvasStore,
} from "@/lib/store";

export function ChatComposer({
  placeholder = "Ask anything",
  disabled = false,
  onSubmit,
  variant = "chat",
}: {
  placeholder?: string;
  disabled?: boolean;
  onSubmit: (question: string, options?: FollowUpOptions) => void;
  variant?: "chat" | "canvas";
}) {
  const listSessionArtifacts = useCanvasStore((s) => s.listSessionArtifacts);
  const sessionArtifacts = useCanvasStore((s) => s.sessionArtifacts);

  const [draft, setDraft] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [artifactMenuOpen, setArtifactMenuOpen] = useState(false);
  const [attached, setAttached] = useState<AttachedArtifactRef[]>([]);
  const [pendingImages, setPendingImages] = useState<CardImage[]>([]);
  const [pendingFiles, setPendingFiles] = useState<PendingFileAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textarea = useAutoResizeTextarea(draft);
  const menuRef = useRef<HTMLDivElement>(null);

  const canSend =
    !disabled && draft.trim().length > 0;

  const submit = () => {
    const q = draft.trim();
    if (!q || !canSend) return;
    onSubmit(q, {
      attachedArtifacts: attached.length > 0 ? attached : undefined,
      pendingImages: pendingImages.length > 0 ? pendingImages : undefined,
      pendingFiles: pendingFiles.length > 0 ? pendingFiles : undefined,
    });
    setDraft("");
    setAttached([]);
    setPendingImages([]);
    setPendingFiles([]);
    setMenuOpen(false);
    setArtifactMenuOpen(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const readFileAsBase64 = (file: File): Promise<PendingFileAttachment> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.includes(",") ? result.split(",")[1]! : result;
        resolve({
          name: file.name,
          mimeType: file.type || "application/octet-stream",
          base64,
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const onImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const next: CardImage[] = [];
    for (const file of Array.from(files)) {
      const dataUrl = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result as string);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      next.push({
        url: dataUrl,
        thumb: dataUrl,
        alt: file.name,
      });
    }
    setPendingImages((prev) => [...prev, ...next]);
    e.target.value = "";
    setMenuOpen(false);
  };

  const onFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const next: PendingFileAttachment[] = [];
    for (const file of Array.from(files)) {
      next.push(await readFileAsBase64(file));
    }
    setPendingFiles((prev) => [...prev, ...next]);
    e.target.value = "";
    setMenuOpen(false);
  };

  const attachArtifact = (artifactId: string, versionId: string) => {
    setAttached([{ artifactId, versionId }]);
    setArtifactMenuOpen(false);
    setMenuOpen(false);
  };

  const artifacts = listSessionArtifacts();
  const isCanvas = variant === "canvas";

  const { onDragOver, onDrop } = useSidebarDropTarget({
    onArtifact: (ref) => {
      setAttached([ref]);
    },
    onUpload: (file) => {
      setPendingFiles((prev) => [...prev, file]);
    },
  });

  return (
    <div
      className={
        isCanvas
          ? "relative z-20 shrink-0"
          : "mx-auto w-full max-w-3xl"
      }
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div
        className={`group/composer relative flex flex-col rounded-2xl border border-canvas-border bg-canvas-card shadow-card ${
          isCanvas ? "" : ""
        }`}
      >
        {(attached.length > 0 ||
          pendingImages.length > 0 ||
          pendingFiles.length > 0) && (
          <div className="flex flex-wrap gap-2 border-b border-canvas-border px-3 py-2">
            {attached.map((ref) => {
              const art = sessionArtifacts[ref.artifactId];
              if (!art) return null;
              const ver =
                getVersionById(art, ref.versionId) ?? getLatestVersion(art);
              return (
                <ArtifactAttachmentPill
                  key={ref.artifactId}
                  kind={art.kind}
                  title={artifactDisplayTitle(art, ver)}
                  versionNumber={ver.number}
                  onRemove={() => setAttached([])}
                />
              );
            })}
            {pendingImages.map((img, i) => (
              <div
                key={i}
                className="relative h-10 w-10 overflow-hidden rounded-lg border border-canvas-border"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.thumb} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  aria-label="Remove image"
                  onClick={() =>
                    setPendingImages((p) => p.filter((_, j) => j !== i))
                  }
                  className="absolute right-0 top-0 bg-canvas-ink/60 px-1 text-[10px] text-white"
                >
                  ×
                </button>
              </div>
            ))}
            {pendingFiles.map((f, i) => (
              <span
                key={i}
                className="inline-flex items-center rounded-lg border border-canvas-border px-2 py-1 text-[11px] text-canvas-muted"
              >
                {f.name}
                <button
                  type="button"
                  className="ml-1"
                  onClick={() =>
                    setPendingFiles((p) => p.filter((_, j) => j !== i))
                  }
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex min-w-0 items-end gap-0 px-2 py-2">
          <div className="relative shrink-0" ref={menuRef}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => setMenuOpen((o) => !o)}
              className="group/plus mb-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-canvas-bg text-canvas-ink transition-colors hover:bg-canvas-border/60 disabled:opacity-40"
              aria-label="Add attachment"
            >
              <span className="text-[20px] font-light leading-none">+</span>
            </button>
            {menuOpen && (
              <div className="absolute bottom-full left-0 z-50 mb-2 min-w-[160px] overflow-hidden rounded-xl border border-canvas-border bg-canvas-card py-1 shadow-card">
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-[13px] hover:bg-canvas-bg"
                  onClick={() => imageInputRef.current?.click()}
                >
                  Image
                </button>
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-[13px] hover:bg-canvas-bg"
                  onClick={() => fileInputRef.current?.click()}
                >
                  File
                </button>
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-[13px] hover:bg-canvas-bg"
                  onClick={() => {
                    setArtifactMenuOpen((o) => !o);
                  }}
                >
                  Artifact…
                </button>
                {artifactMenuOpen && (
                  <div className="max-h-40 overflow-y-auto border-t border-canvas-border">
                    {artifacts.length === 0 ? (
                      <p className="px-3 py-2 text-[12px] text-canvas-muted">
                        No artifacts yet
                      </p>
                    ) : (
                      artifacts.map((art) => {
                        const ver = getLatestVersion(art);
                        return (
                          <button
                            key={art.id}
                            type="button"
                            className="block w-full px-3 py-2 text-left text-[12px] hover:bg-canvas-bg"
                            onClick={() =>
                              attachArtifact(art.id, ver.id)
                            }
                          >
                            {artifactDisplayTitle(art, ver)}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mx-1 mb-2 h-6 w-px shrink-0 bg-canvas-border" aria-hidden />

          <textarea
            ref={textarea.ref}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              textarea.resize();
            }}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={`block min-w-0 flex-1 resize-none overflow-hidden border-0 bg-transparent py-2 text-canvas-ink outline-none placeholder:text-canvas-muted/70 disabled:opacity-50 ${
              isCanvas ? "text-[14px]" : "text-[15px]"
            }`}
          />

          <button
            type="button"
            onClick={submit}
            disabled={!canSend}
            className="group/send mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center text-canvas-accent transition-opacity hover:opacity-90 disabled:opacity-30"
            aria-label="Send"
          >
            <svg viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor" aria-hidden>
              <path d="M2.5 10 17 3 14 10 17 17 2.5 10Z" />
            </svg>
          </button>
        </div>
      </div>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onImagePick}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf,.txt,.json,.md"
        className="hidden"
        onChange={onFilePick}
      />
    </div>
  );
}
