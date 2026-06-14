"use client";

import { useRef, useState } from "react";
import {
  groupCanvasAssets,
  uploadAssetFiles,
} from "@/lib/attachments";
import { AssetContentPreview } from "@/components/canvas/AssetContentPreview";
import { OFFICE_FILE_ACCEPT } from "@/lib/officeAssetKinds";
import { setSidebarDragData } from "@/lib/sidebarDnD";
import { showUploadErrorsToast } from "@/lib/uploadErrorToast";
import { useCanvasStore } from "@/lib/store";
import { useAuth } from "@/components/AuthProvider";

function DraggableAssetRow({ id }: { id: string }) {
  const asset = useCanvasStore((s) => s.canvasAssets[id]);
  if (!asset) return null;

  return (
    <div className="flex w-full items-center gap-1 rounded-canvas px-1 py-0.5 hover:bg-canvas-bg">
      <div
        draggable
        onDragStart={(e) => {
          setSidebarDragData(e.dataTransfer, {
            kind: "asset",
            assetId: id,
          });
        }}
        className="flex min-w-0 flex-1 cursor-grab items-center gap-2 px-1 py-1 text-canvas-body text-canvas-ink active:cursor-grabbing"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-canvas bg-canvas-bg">
          <AssetContentPreview asset={asset} layout="sidebar" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate">{asset.name}</span>
          <span className="block truncate text-canvas-body-sm text-canvas-muted">
            {asset.mimeType}
          </span>
        </span>
      </div>
      <button
        type="button"
        aria-label={`Remove ${asset.name}`}
        onClick={() => {
          useCanvasStore.getState().removeCanvasAsset(id);
        }}
        className="shrink-0 px-1 text-canvas-body-lg text-canvas-muted hover:text-canvas-ink"
      >
        x
      </button>
    </div>
  );
}

export function AttachmentsSection() {
  const { user, activeCanvasId } = useAuth();
  const canvasAssets = useCanvasStore((s) => s.canvasAssets);
  const addCanvasAsset = useCanvasStore((s) => s.addCanvasAsset);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const groups = groupCanvasAssets(Object.values(canvasAssets));

  const ingestFiles = async (files: FileList | File[]) => {
    setUploading(true);
    const result = await uploadAssetFiles(
      files,
      user && activeCanvasId ? { userId: user.id, canvasId: activeCanvasId } : null,
    );
    for (const asset of result.assets) addCanvasAsset(asset);
    if (result.errors.length > 0) {
      showUploadErrorsToast(result.errors);
    }
    setUploading(false);
  };

  return (
    <section className="px-3 py-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-canvas-body-lg font-medium uppercase tracking-wider text-canvas-muted">
          Assets
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
        onDrop={async (e) => {
          e.preventDefault();
          if (e.dataTransfer.files.length > 0) {
            await ingestFiles(e.dataTransfer.files);
          }
        }}
      >
        <p className="text-canvas-body-lg text-canvas-muted">
          Drop images, spreadsheets, documents, presentations, or code files here
        </p>
      </div>

      <div className="space-y-3">
        {groups.map((group) => (
          <div key={group.category}>
            <div className="mb-1 text-canvas-body-lg font-medium text-canvas-muted/90">
              {group.label}
            </div>
            {group.items.length === 0 ? (
              <p className="px-2 py-1 text-canvas-body-lg text-canvas-muted/80">
                None yet
              </p>
            ) : (
              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <DraggableAssetRow id={item.id} />
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
        accept={`image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain,text/markdown,text/csv,application/json,.txt,.md,.csv,.json,.ts,.tsx,.js,.jsx,.py,.sql,.css,.html,.go,.rs,.java,.cpp,.c,.cs,.php,.rb,.sh,.yaml,.yml,${OFFICE_FILE_ACCEPT}`}
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
