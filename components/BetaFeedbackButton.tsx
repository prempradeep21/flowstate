"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { ImageIcon, PlusIcon, ScreenshotIcon } from "@/components/MenuIcons";
import { MotionFlowSize } from "@/components/motion/MotionFlowSize";
import { captureAppScreenshot } from "@/lib/feedback/captureAppScreenshot";
import {
  MAX_FEEDBACK_IMAGES,
  uploadFeedbackImages,
  validateFeedbackImage,
} from "@/lib/feedbackImages";

type PendingImage = {
  id: string;
  file: File;
  previewUrl: string;
};

function createPendingImage(file: File): PendingImage {
  return {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    file,
    previewUrl: URL.createObjectURL(file),
  };
}

const imagePillClassName =
  "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-canvas-ink/20 bg-canvas-card px-3 py-1.5 text-canvas-compact text-canvas-muted transition-colors hover:border-canvas-ink/35 hover:text-canvas-ink disabled:cursor-not-allowed disabled:opacity-50";

export function BetaFeedbackButton() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [busy, setBusy] = useState(false);
  const [capturingScreenshot, setCapturingScreenshot] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const pendingImagesRef = useRef(pendingImages);

  pendingImagesRef.current = pendingImages;

  const clearPendingImages = useCallback((images: PendingImage[]) => {
    for (const image of images) {
      URL.revokeObjectURL(image.previewUrl);
    }
  }, []);

  const resetForm = useCallback(() => {
    setMessage("");
    setPendingImages((prev) => {
      clearPendingImages(prev);
      return [];
    });
    setError(null);
    setSubmitted(false);
    setDragOver(false);
    setCapturingScreenshot(false);
  }, [clearPendingImages]);

  const close = useCallback(() => {
    if (busy || capturingScreenshot) return;
    setOpen(false);
    resetForm();
  }, [busy, capturingScreenshot, resetForm]);

  const addImageFiles = useCallback((files: File[]) => {
    const next: PendingImage[] = [];
    for (const file of files) {
      if (!file.type.startsWith("image/")) continue;
      const validationError = validateFeedbackImage(file);
      if (validationError) {
        setError(validationError);
        continue;
      }
      next.push(createPendingImage(file));
    }
    if (next.length === 0) return;
    setError(null);
    setPendingImages((prev) => {
      const combined = [...prev, ...next].slice(0, MAX_FEEDBACK_IMAGES);
      if (combined.length < prev.length + next.length) {
        setError(`You can attach up to ${MAX_FEEDBACK_IMAGES} images.`);
      }
      return combined;
    });
  }, []);

  const handleCaptureScreenshot = useCallback(async () => {
    if (busy || capturingScreenshot || pendingImages.length >= MAX_FEEDBACK_IMAGES) {
      return;
    }

    setCapturingScreenshot(true);
    setError(null);
    try {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });
      const file = await captureAppScreenshot();
      if (!file) {
        throw new Error("Could not capture a screenshot.");
      }
      addImageFiles([file]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not capture a screenshot.",
      );
    } finally {
      setCapturingScreenshot(false);
    }
  }, [addImageFiles, busy, capturingScreenshot, pendingImages.length]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    return () => {
      clearPendingImages(pendingImagesRef.current);
    };
  }, [clearPendingImages]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const onPointerDown = (e: PointerEvent) => {
      const el = rootRef.current;
      if (el && el.contains(e.target as Node)) return;
      close();
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [close, open]);

  const removePendingImage = useCallback((id: string) => {
    setPendingImages((prev) => {
      const target = prev.find((image) => image.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((image) => image.id !== id);
    });
  }, []);

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
    addImageFiles(imageFiles);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const imageFiles = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/"),
    );
    if (imageFiles.length === 0) return;
    addImageFiles(imageFiles);
  };

  const onImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    addImageFiles(Array.from(files));
    e.target.value = "";
  };

  const handleSubmit = useCallback(async () => {
    const trimmed = message.trim();
    if (!trimmed || busy) return;

    setBusy(true);
    setError(null);
    try {
      const { urls: imageUrls, error: uploadError } = await uploadFeedbackImages(
        pendingImages.map((image) => image.file),
        user?.id ?? null,
      );
      if (uploadError) {
        throw new Error(uploadError);
      }

      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          pageUrl: window.location.href,
          imageUrls,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? "Could not send suggestion");
      }

      setSubmitted(true);
      setMessage("");
      setPendingImages((prev) => {
        clearPendingImages(prev);
        return [];
      });
      window.setTimeout(() => close(), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send suggestion");
    } finally {
      setBusy(false);
    }
  }, [busy, clearPendingImages, close, message, pendingImages, user?.id]);

  const imageActionsDisabled =
    busy || capturingScreenshot || pendingImages.length >= MAX_FEEDBACK_IMAGES;

  return (
    <div
      ref={rootRef}
      data-feedback-capture-exclude
      className="relative shrink-0"
    >
      <div className="rounded-canvas border border-canvas-border bg-canvas-card shadow-card">
        <div className="floating-chrome-padding flex items-center">
          <button
            type="button"
            aria-label="Give a suggestion"
            aria-expanded={open}
            aria-haspopup="dialog"
            onClick={() => setOpen((v) => !v)}
            className={`flex items-center gap-2 rounded-canvas text-canvas-ink transition-colors hover:bg-canvas-bg/80 ${
              open ? "bg-canvas-bg/80" : ""
            }`}
          >
            <PlusIcon className="h-5 w-5 shrink-0" />
            <span className="hidden text-canvas-body-sm font-medium sm:inline">
              Suggestions
            </span>
          </button>
        </div>
      </div>

      {open && (
        <MotionFlowSize
          role="dialog"
          aria-label="Beta suggestion"
          className="absolute right-0 top-full z-50 mt-2 flex w-[min(calc(100vw-2rem),320px)] flex-col rounded-canvas border border-canvas-border bg-canvas-card p-4 shadow-card"
        >
          <h3 className="mb-1 text-canvas-body-sm font-semibold text-canvas-ink">
            Beta suggestion
          </h3>
          <p className="mb-3 text-canvas-compact text-canvas-muted">
            Help shape Flowstate — what should we improve?
          </p>

          {submitted ? (
            <p className="text-canvas-body-sm text-canvas-accent">
              Thanks — we got your suggestion.
            </p>
          ) : (
            <>
              {pendingImages.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {pendingImages.map((image) => (
                    <div
                      key={image.id}
                      className="relative h-14 w-14 overflow-hidden rounded-canvas border border-canvas-border"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image.previewUrl}
                        alt={image.file.name || "Attached image"}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        aria-label={`Remove ${image.file.name || "image"}`}
                        disabled={busy || capturingScreenshot}
                        onClick={() => removePendingImage(image.id)}
                        className="absolute right-0 top-0 bg-canvas-ink/60 px-1 text-canvas-micro text-white disabled:opacity-50"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div
                className={`mb-2 rounded-canvas border bg-canvas-bg transition-colors ${
                  dragOver
                    ? "border-canvas-accent ring-1 ring-canvas-accent/30"
                    : "border-canvas-border"
                }`}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
              >
                <textarea
                  ref={inputRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onPaste={onPaste}
                  rows={4}
                  placeholder="Share an idea, bug, or improvement…"
                  disabled={busy || capturingScreenshot}
                  className="w-full resize-none bg-transparent px-3 py-2 text-canvas-body-sm text-canvas-ink outline-none disabled:opacity-60"
                />
              </div>

              <div className="mb-3 flex flex-wrap items-center gap-1.5">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  multiple
                  className="hidden"
                  onChange={onImagePick}
                />
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={imageActionsDisabled}
                  className={imagePillClassName}
                >
                  <ImageIcon />
                  Attach Image
                </button>
                <button
                  type="button"
                  onClick={() => void handleCaptureScreenshot()}
                  disabled={imageActionsDisabled}
                  className={imagePillClassName}
                >
                  <ScreenshotIcon />
                  {capturingScreenshot ? "Capturing…" : "Capture Screenshot"}
                </button>
              </div>

              {error && (
                <p className="mb-2 text-canvas-compact text-canvas-danger">
                  {error}
                </p>
              )}

              <div className="mt-auto pt-1">
                {user?.email && (
                  <p className="mb-3 text-canvas-micro text-canvas-muted">
                    Sending as {user.email}
                  </p>
                )}
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={close}
                    disabled={busy || capturingScreenshot}
                    className="rounded-canvas border border-canvas-border px-3 py-1.5 text-canvas-body-sm text-canvas-muted transition-colors hover:bg-canvas-bg disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSubmit()}
                    disabled={busy || capturingScreenshot || !message.trim()}
                    className="rounded-canvas bg-canvas-ink px-3 py-1.5 text-canvas-body-sm font-medium text-canvas-card transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busy ? "Sending…" : "Submit"}
                  </button>
                </div>
              </div>
            </>
          )}
        </MotionFlowSize>
      )}
    </div>
  );
}
