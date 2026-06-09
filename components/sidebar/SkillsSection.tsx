"use client";

import { useRef, useState } from "react";
import { SkillSidebarTile } from "@/components/sidebar/SkillSidebarTile";
import { SkillUploadModal } from "@/components/sidebar/SkillUploadModal";
import { useAuth } from "@/components/AuthProvider";
import {
  isSkillFile,
  uploadSkillFiles,
  type SkillUploadBatchResult,
} from "@/lib/skills";
import type { AssetUploadError } from "@/lib/attachments";
import { useCanvasStore } from "@/lib/store";

export function SkillsSection() {
  const { user, activeCanvasId } = useAuth();
  const canvasSkills = useCanvasStore((s) => s.canvasSkills);
  const addCanvasSkill = useCanvasStore((s) => s.addCanvasSkill);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<AssetUploadError[]>([]);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const skillIds = Object.values(canvasSkills)
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((s) => s.id);

  const queueFiles = (files: FileList | File[]) => {
    const mdFiles = Array.from(files).filter(isSkillFile);
    const invalid = Array.from(files).filter((f) => !isSkillFile(f));
    if (invalid.length > 0) {
      setErrors(
        invalid.map((file) => ({
          fileName: file.name,
          code: "unsupported-type" as const,
          message: `${file.name} is not a markdown skill file (.md).`,
        })),
      );
    }
    if (mdFiles.length > 0) {
      setPendingFile(mdFiles[0]!);
      setUploadError(null);
    }
  };

  const handleUpload = async (title: string) => {
    if (!pendingFile) return;
    setUploading(true);
    setUploadError(null);
    const result: SkillUploadBatchResult = await uploadSkillFiles(
      [pendingFile],
      user && activeCanvasId ? { userId: user.id, canvasId: activeCanvasId } : null,
      { [pendingFile.name]: title },
    );
    for (const skill of result.skills) addCanvasSkill(skill);
    if (result.errors.length > 0) {
      setUploadError(result.errors[0]!.message);
      setErrors((prev) => [...prev, ...result.errors]);
    } else {
      setPendingFile(null);
    }
    setUploading(false);
  };

  return (
    <section className="px-3 py-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-canvas-body-lg font-medium uppercase tracking-wider text-canvas-muted">
          Skills
        </h3>
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="rounded-canvas border border-canvas-border px-2 py-0.5 text-canvas-body-lg font-medium text-canvas-ink hover:bg-canvas-bg disabled:opacity-50"
        >
          {uploading ? "Uploading" : "Upload"}
        </button>
      </div>

      <div
        className="mb-2 rounded-canvas border border-dashed border-canvas-border/80 px-2 py-3 text-center"
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes("Files")) {
            e.preventDefault();
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files.length > 0) {
            queueFiles(e.dataTransfer.files);
          }
        }}
      >
        <p className="text-canvas-body-lg text-canvas-muted">
          Drop .md skill files here
        </p>
      </div>

      {errors.length > 0 && (
        <div className="mb-3 space-y-1 rounded-canvas border border-red-300/60 bg-red-50 px-2 py-2 text-canvas-body-sm text-red-700">
          {errors.map((error, index) => (
            <p key={`${error.code}-${error.fileName ?? index}`}>
              {error.message}
            </p>
          ))}
        </div>
      )}

      {skillIds.length === 0 ? (
        <p className="py-4 text-center text-canvas-body text-canvas-muted/80">
          No skills yet
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {skillIds.map((id) => (
            <SkillSidebarTile key={id} skillId={id} />
          ))}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="text/markdown,.md"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) queueFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <SkillUploadModal
        isOpen={pendingFile !== null}
        fileName={pendingFile?.name ?? ""}
        busy={uploading}
        error={uploadError}
        onConfirm={handleUpload}
        onCancel={() => {
          if (!uploading) setPendingFile(null);
        }}
      />
    </section>
  );
}
