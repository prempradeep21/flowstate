"use client";

import {
  KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { ArtifactAttachmentPill } from "@/components/artifacts/ArtifactAttachmentPill";
import { AssetAttachmentPill } from "@/components/AssetAttachmentPill";
import { ComposerModelPicker } from "@/components/ComposerModelPicker";
import { menuItemClass } from "@/components/MenuIcons";
import { SkillAttachmentPill } from "@/components/SkillAttachmentPill";
import { GroupAttachmentPill } from "@/components/GroupAttachmentPill";
import { ReceivePlugs } from "@/components/plugs/ReceivePlugs";
import { SendIconButton } from "@/components/SendIconButton";
import {
  artifactDisplayTitle,
  getLatestVersion,
  getVersionById,
} from "@/lib/sessionArtifacts";
import { useGoogleConnection } from "@/hooks/useGoogleConnection";
import { useGooglePicker } from "@/hooks/useGooglePicker";
import { useSidebarDropTarget } from "@/hooks/useSidebarDropTarget";
import { useAutoResizeTextarea } from "@/lib/useAutoResizeTextarea";
import {
  decrementLocalEditGuard,
  incrementLocalEditGuard,
} from "@/lib/localEditGuard";
import { CANVAS_ACCENT } from "@/lib/design/tokens";
import {
  AttachedArtifactRef,
  AttachedAssetRef,
  AttachedGroupRef,
  AttachedSkillRef,
  CardImage,
  FollowUpOptions,
  PendingFileAttachment,
  useCanvasStore,
} from "@/lib/store";

export function ChatComposer({
  placeholder = "Ask anything",
  disabled = false,
  autoFocus = false,
  cardId,
  accentColour = CANVAS_ACCENT,
  receivePlugsActive = false,
  receiveHighlightSide = null,
  draftValue,
  onDraftChange,
  lockedPrefix,
  onSubmit,
  variant = "chat",
  trailingControls,
}: {
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  /** Canvas card id — enables plug attachment sync and receive targeting. */
  cardId?: string;
  accentColour?: string;
  receivePlugsActive?: boolean;
  receiveHighlightSide?: "left" | "right" | null;
  draftValue?: string;
  onDraftChange?: (value: string) => void;
  /** Read-only quoted text shown before the textarea (branch-from-selection). */
  lockedPrefix?: string;
  onSubmit: (question: string, options?: FollowUpOptions) => void;
  variant?: "chat" | "canvas" | "landing";
  /** Rendered after the send button inside the composer row (e.g. card menu). */
  trailingControls?: ReactNode;
}) {
  const listSessionArtifacts = useCanvasStore((s) => s.listSessionArtifacts);
  const sessionArtifacts = useCanvasStore((s) => s.sessionArtifacts);
  const canvasAssets = useCanvasStore((s) => s.canvasAssets);
  const canvasSkills = useCanvasStore((s) => s.canvasSkills);
  const plugAttachment = useCanvasStore((s) =>
    cardId ? s.plugComposerAttachments[cardId] : undefined,
  );
  const plugAssetAttachment = useCanvasStore((s) =>
    cardId ? s.plugComposerAssetAttachments[cardId] : undefined,
  );
  const plugSkillAttachment = useCanvasStore((s) =>
    cardId ? s.plugComposerSkillAttachments[cardId] : undefined,
  );
  const plugGroupAttachment = useCanvasStore((s) =>
    cardId ? s.plugComposerGroupAttachments[cardId] : undefined,
  );
  const groups = useCanvasStore((s) => s.groups);
  const storedComposerDraft = useCanvasStore((s) =>
    cardId ? s.composerDraftsByCardId[cardId] : undefined,
  );
  const setComposerDraft = useCanvasStore((s) => s.setComposerDraft);
  const clearComposerDraft = useCanvasStore((s) => s.clearComposerDraft);

  const [internalDraft, setInternalDraft] = useState("");
  const draft =
    draftValue ??
    (cardId ? storedComposerDraft ?? "" : internalDraft);
  const setDraft = useCallback(
    (value: string | ((prev: string) => string)) => {
      const next =
        typeof value === "function"
          ? value(
              draftValue ??
                (cardId ? storedComposerDraft ?? "" : internalDraft),
            )
          : value;
      if (onDraftChange) {
        onDraftChange(next);
      } else if (cardId) {
        setComposerDraft(cardId, next);
      } else {
        setInternalDraft(next);
      }
    },
    [
      cardId,
      draftValue,
      internalDraft,
      onDraftChange,
      setComposerDraft,
      storedComposerDraft,
    ],
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [artifactMenuOpen, setArtifactMenuOpen] = useState(false);
  const [attached, setAttached] = useState<AttachedArtifactRef[]>([]);
  const [attachedAssets, setAttachedAssets] = useState<AttachedAssetRef[]>([]);
  const [attachedSkills, setAttachedSkills] = useState<AttachedSkillRef[]>([]);
  const [attachedGroups, setAttachedGroups] = useState<AttachedGroupRef[]>([]);
  const [pendingImages, setPendingImages] = useState<CardImage[]>([]);
  const [pendingFiles, setPendingFiles] = useState<PendingFileAttachment[]>([]);
  const { connected: googleConnected, connect: connectGoogle } = useGoogleConnection();
  const { openPicker: openGooglePicker, busy: googlePickerBusy } = useGooglePicker();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textarea = useAutoResizeTextarea(draft);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuPortalRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState<{ left: number; top: number } | null>(
    null,
  );

  useEffect(() => {
    if (autoFocus) textarea.ref.current?.focus();
  }, [autoFocus, textarea.ref]);

  useEffect(() => {
    if (!cardId || draft.trim().length === 0) return;
    incrementLocalEditGuard();
    return () => decrementLocalEditGuard();
  }, [cardId, draft]);

  const addAttachment = (ref: AttachedArtifactRef) => {
    setAttached((prev) => {
      const idx = prev.findIndex((r) => r.artifactId === ref.artifactId);
      if (idx === -1) return [...prev, ref];
      const next = [...prev];
      next[idx] = ref;
      return next;
    });
  };

  const addAssetAttachment = (ref: AttachedAssetRef) => {
    setAttachedAssets((prev) => {
      if (prev.some((r) => r.assetId === ref.assetId)) return prev;
      return [...prev, ref];
    });
  };

  const addSkillAttachment = (ref: AttachedSkillRef) => {
    setAttachedSkills((prev) => {
      if (prev.some((r) => r.skillId === ref.skillId)) return prev;
      return [...prev, ref];
    });
  };

  const addGroupAttachment = (ref: AttachedGroupRef) => {
    setAttachedGroups((prev) => {
      if (prev.some((r) => r.groupId === ref.groupId)) return prev;
      return [...prev, ref];
    });
  };

  useEffect(() => {
    if (plugAttachment) {
      addAttachment(plugAttachment);
    }
  }, [plugAttachment]);

  useEffect(() => {
    if (plugAssetAttachment) {
      addAssetAttachment(plugAssetAttachment);
    }
  }, [plugAssetAttachment]);

  useEffect(() => {
    if (plugSkillAttachment) {
      addSkillAttachment(plugSkillAttachment);
    }
  }, [plugSkillAttachment]);

  useEffect(() => {
    if (plugGroupAttachment) {
      addGroupAttachment(plugGroupAttachment);
    }
  }, [plugGroupAttachment]);

  useEffect(() => {
    if (!menuOpen) {
      setMenuPos(null);
      return;
    }

    const updatePosition = () => {
      if (!menuRef.current) return;
      const rect = menuRef.current.getBoundingClientRect();
      setMenuPos({ left: rect.left, top: rect.top - 8 });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target)) return;
      if (menuPortalRef.current?.contains(target)) return;
      setMenuOpen(false);
      setArtifactMenuOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [menuOpen]);

  const canSend =
    !disabled && draft.trim().length > 0;

  const submit = () => {
    const q = draft.trim();
    if (!q || !canSend) return;
    const question = lockedPrefix ? `${lockedPrefix}: ${q}` : q;
    onSubmit(question, {
      attachedArtifacts: attached.length > 0 ? attached : undefined,
      attachedAssets: attachedAssets.length > 0 ? attachedAssets : undefined,
      attachedSkills: attachedSkills.length > 0 ? attachedSkills : undefined,
      attachedGroups: attachedGroups.length > 0 ? attachedGroups : undefined,
      pendingImages: pendingImages.length > 0 ? pendingImages : undefined,
      pendingFiles: pendingFiles.length > 0 ? pendingFiles : undefined,
    });
    if (cardId) {
      clearComposerDraft(cardId);
    } else {
      setDraft("");
    }
    setAttached([]);
    setAttachedAssets([]);
    setAttachedGroups([]);
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

  const textToPendingFile = (name: string, text: string): PendingFileAttachment => ({
    name,
    mimeType: "text/plain",
    base64: btoa(
      new TextEncoder()
        .encode(text)
        .reduce((acc, byte) => acc + String.fromCharCode(byte), ""),
    ),
  });

  const importPickedDriveFile = useCallback(async (doc: {
    id: string;
    name: string;
    url?: string;
  }) => {
    try {
      const params = new URLSearchParams({ fileId: doc.id });
      if (doc.url) params.set("url", doc.url);
      const res = await fetch(`/api/google/files?${params.toString()}`);
      const body = (await res.json()) as {
        extractedText?: string;
        title?: string;
        needsConnect?: boolean;
        error?: string;
      };
      if (body.needsConnect) {
        connectGoogle({ intent: "picker" });
        return;
      }
      if (!res.ok || !body.extractedText) {
        window.alert(body.error ?? "Could not import the selected file.");
        return;
      }
      setPendingFiles((prev) => [
        ...prev,
        textToPendingFile(
          body.title ?? doc.name ?? "Google file",
          body.extractedText!,
        ),
      ]);
    } catch {
      window.alert("Could not import the selected file.");
    }
  }, [connectGoogle]);

  const attachGoogleDriveFile = () => {
    setMenuOpen(false);
    setArtifactMenuOpen(false);
    if (!googleConnected) {
      connectGoogle({ intent: "picker" });
      return;
    }
    void openGooglePicker((doc) => {
      void importPickedDriveFile(doc);
    });
  };

  useEffect(() => {
    const onResumePicker = () => {
      void openGooglePicker((doc) => {
        void importPickedDriveFile(doc);
      });
    };
    window.addEventListener("flowstate:google-picker-resume", onResumePicker);
    return () =>
      window.removeEventListener("flowstate:google-picker-resume", onResumePicker);
  }, [importPickedDriveFile, openGooglePicker]);

  const addImageFiles = async (files: File[]) => {
    const next: CardImage[] = [];
    for (const file of files) {
      if (!file.type.startsWith("image/")) continue;
      const dataUrl = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result as string);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      next.push({
        url: dataUrl,
        thumb: dataUrl,
        alt: file.name || "Pasted image",
      });
    }
    if (next.length === 0) return;
    setPendingImages((prev) => [...prev, ...next]);
  };

  const onImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    await addImageFiles(Array.from(files));
    e.target.value = "";
    setMenuOpen(false);
  };

  const onPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const imageFiles: File[] = [];
    for (const item of Array.from(items)) {
      if (!item.type.startsWith("image/")) continue;
      const file = item.getAsFile();
      if (file) imageFiles.push(file);
    }
    if (imageFiles.length === 0) return;
    e.preventDefault();
    void addImageFiles(imageFiles);
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
    addAttachment({ artifactId, versionId });
    setArtifactMenuOpen(false);
    setMenuOpen(false);
  };

  const artifacts = listSessionArtifacts();
  const isCanvas = variant === "canvas";
  const isLanding = variant === "landing";

  const { onDragOver, onDrop } = useSidebarDropTarget({
    onArtifact: (ref) => {
      addAttachment(ref);
    },
    onAsset: (ref) => {
      addAssetAttachment(ref);
    },
    onSkill: (ref) => {
      addSkillAttachment(ref);
    },
    onUpload: (file) => {
      setPendingFiles((prev) => [...prev, file]);
    },
  });

  return (
    <div
      className={
        isLanding
          ? "relative z-20 w-full shrink-0"
          : isCanvas
            ? "relative z-20 w-full min-w-0 shrink-0"
            : "mx-auto w-full max-w-3xl"
      }
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div
        data-composer={cardId ? true : undefined}
        data-card-id={cardId}
        className={`chat-composer-casing group/composer relative flex w-full min-w-0 flex-col rounded-canvas border border-canvas-border bg-canvas-card ${
          isLanding ? "shadow-artifactHover" : "shadow-card"
        }`}
      >
        {isCanvas && cardId && (
          <ReceivePlugs
            accentColour={accentColour}
            active={receivePlugsActive}
            highlightSide={receiveHighlightSide}
          />
        )}
        {(attached.length > 0 ||
          attachedAssets.length > 0 ||
          attachedSkills.length > 0 ||
          attachedGroups.length > 0 ||
          pendingImages.length > 0 ||
          pendingFiles.length > 0) && (
          <div
            className={`flex gap-2 border-b border-canvas-border py-2 ${
              isCanvas
                ? "w-full min-w-0 flex-col px-3 pr-10"
                : "overflow-x-auto px-3"
            }`}
          >
            {attached.map((ref) => {
              const art = sessionArtifacts[ref.artifactId];
              if (!art) return null;
              const ver =
                getVersionById(art, ref.versionId) ?? getLatestVersion(art);
              if (!ver) return null;
              return (
                <div
                  key={ref.artifactId}
                  className={
                    isCanvas
                      ? "max-w-full self-start"
                      : "min-w-[calc(50%-4px)] max-w-full shrink-0"
                  }
                >
                  <ArtifactAttachmentPill
                    kind={art.kind}
                    title={artifactDisplayTitle(art, ver)}
                    versionNumber={ver.number}
                    onRemove={() =>
                      setAttached((prev) =>
                        prev.filter((r) => r.artifactId !== ref.artifactId),
                      )
                    }
                  />
                </div>
              );
            })}
            {attachedAssets.map((ref) => {
              const asset = canvasAssets[ref.assetId];
              if (!asset) return null;
              return (
                <AssetAttachmentPill
                  key={ref.assetId}
                  name={asset.name}
                  kind={asset.kind}
                  onRemove={() =>
                    setAttachedAssets((prev) =>
                      prev.filter((r) => r.assetId !== ref.assetId),
                    )
                  }
                />
              );
            })}
            {attachedSkills.map((ref) => {
              const skill = canvasSkills[ref.skillId];
              if (!skill) return null;
              return (
                <SkillAttachmentPill
                  key={ref.skillId}
                  title={skill.title}
                  onRemove={() =>
                    setAttachedSkills((prev) =>
                      prev.filter((r) => r.skillId !== ref.skillId),
                    )
                  }
                />
              );
            })}
            {attachedGroups.map((ref) => {
              const group = groups[ref.groupId];
              if (!group) return null;
              const memberCount =
                group.familyRootThreadIds.length + (group.items?.length ?? 0);
              return (
                <GroupAttachmentPill
                  key={ref.groupId}
                  label={group.label}
                  memberCount={memberCount}
                  onRemove={() =>
                    setAttachedGroups((prev) =>
                      prev.filter((r) => r.groupId !== ref.groupId),
                    )
                  }
                />
              );
            })}
            {pendingImages.map((img, i) => (
              <div
                key={i}
                className="relative h-10 w-10 overflow-hidden rounded-canvas border border-canvas-border"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.thumb} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  aria-label="Remove image"
                  onClick={() =>
                    setPendingImages((p) => p.filter((_, j) => j !== i))
                  }
                  className="absolute right-0 top-0 bg-canvas-ink/60 px-1 text-canvas-micro text-white"
                >
                  ×
                </button>
              </div>
            ))}
            {pendingFiles.map((f, i) => (
              <AssetAttachmentPill
                key={i}
                name={f.name}
                kind="document"
                onRemove={() =>
                  setPendingFiles((p) => p.filter((_, j) => j !== i))
                }
              />
            ))}
          </div>
        )}

        {/* Question row: input spans end-to-end, send button beside it. */}
        <div className="flex min-w-0 items-center gap-2 px-3 py-2">
          <div
            className={`flex min-w-0 flex-1 ${
              lockedPrefix ? "flex-col items-stretch gap-1.5" : "items-center"
            }`}
          >
            {lockedPrefix && (
              <span
                className="rounded-canvas bg-canvas-accent/15 px-2.5 py-1.5 text-canvas-body-sm font-medium leading-snug text-canvas-accent break-words"
              >
                {lockedPrefix}
              </span>
            )}
            <textarea
              ref={textarea.ref}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                textarea.resize();
              }}
              onKeyDown={onKeyDown}
              onPaste={onPaste}
              placeholder={placeholder}
              disabled={disabled}
              rows={1}
              className={`block min-w-0 w-full resize-none overflow-hidden border-0 bg-transparent py-2 text-canvas-ink outline-none placeholder:text-canvas-muted/70 disabled:opacity-50 ${
                isCanvas || isLanding ? "text-canvas-body" : "text-canvas-body-lg"
              }`}
            />
          </div>

          <SendIconButton disabled={!canSend} onClick={submit} />
        </div>

        {/* Controls row: attachments, card menu, and model selector. */}
        <div className="flex items-center gap-1 border-t border-canvas-border px-2 py-1.5">
          <div className="relative shrink-0" ref={menuRef}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => setMenuOpen((o) => !o)}
              className="btn group/plus h-9 w-9 rounded-full bg-canvas-bg text-canvas-ink"
              aria-label="Add attachment"
            >
              <span className="text-canvas-heading font-light leading-none">+</span>
            </button>
            {menuOpen &&
              menuPos &&
              createPortal(
                <div
                  ref={menuPortalRef}
                  className="fixed z-[9999] min-w-[160px] overflow-hidden rounded-canvas border border-canvas-border bg-canvas-card py-1 shadow-card"
                  style={{
                    left: menuPos.left,
                    top: menuPos.top,
                    transform: "translateY(-100%)",
                  }}
                >
                  <button
                    type="button"
                    className={menuItemClass}
                    onClick={() => imageInputRef.current?.click()}
                  >
                    Image
                  </button>
                  <button
                    type="button"
                    className={menuItemClass}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    File
                  </button>
                  <button
                    type="button"
                    disabled={googlePickerBusy}
                    className={menuItemClass}
                    onClick={attachGoogleDriveFile}
                  >
                    Google Drive…
                  </button>
                  <button
                    type="button"
                    className={menuItemClass}
                    onClick={() => {
                      setArtifactMenuOpen((o) => !o);
                    }}
                  >
                    Artifact…
                  </button>
                  {artifactMenuOpen && (
                    <div className="max-h-40 overflow-y-auto border-t border-canvas-border">
                      {artifacts.length === 0 ? (
                        <p className="px-3 py-2 text-canvas-compact text-canvas-muted">
                          No artifacts yet
                        </p>
                      ) : (
                        artifacts.map((art) => {
                          const ver = getLatestVersion(art);
                          if (!ver) return null;
                          return (
                            <button
                              key={art.id}
                              type="button"
                              className={menuItemClass}
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
                </div>,
                document.body,
              )}
          </div>

          {trailingControls}

          <div className="ml-auto">
            <ComposerModelPicker
              disabled={disabled}
              restrictToAnthropic={pendingFiles.some(
                (f) => f.mimeType === "application/pdf",
              )}
            />
          </div>
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
        multiple
        className="hidden"
        onChange={onFilePick}
      />
    </div>
  );
}
