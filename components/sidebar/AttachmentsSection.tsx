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

function DraggableAssetTile({ id }: { id: string }) {
  const asset = useCanvasStore((s) => s.canvasAssets[id]);
  if (!asset) return null;

  return (
    <div className="group relative aspect-square overflow-hidden rounded-canvas border border-canvas-border bg-canvas-bg">
      <div
        draggable
        title={asset.name}
        onDragStart={(e) => {
          setSidebarDragData(e.dataTransfer, {
            kind: "asset",
            assetId: id,
          });
        }}
        className="flex h-full w-full cursor-grab items-center justify-center active:cursor-grabbing"
      >
        <AssetContentPreview asset={asset} layout="sidebar" />
      </div>
      <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-1.5 pb-1 pt-3 text-canvas-body-sm text-white opacity-0 transition-opacity group-hover:opacity-100">
        {asset.name}
      </span>
      <button
        type="button"
        aria-label={`Remove ${asset.name}`}
        onClick={() => {
          useCanvasStore.getState().removeCanvasAsset(id);
        }}
        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-canvas-body-sm text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100"
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
              <ul className="grid grid-cols-3 gap-1.5">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <DraggableAssetTile id={item.id} />
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
