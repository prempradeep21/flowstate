"use client";

import { Plus, Trash2 } from "lucide-react";
import { ArtifactTypeIcon } from "@/components/artifacts/ArtifactTypeIcon";
import { Button } from "@/components/ui/Button";
import { CloseButton } from "@/components/ui/CloseButton";
import { IconButton } from "@/components/ui/IconButton";
import {
  ARTIFACT_CATEGORY_META,
  artifactCategoryStyle,
} from "@/lib/design/theme/artifactCategories";
import { ARTIFACT_CATEGORY_IDS } from "@/lib/design/theme/types";

function PreviewCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <p className="text-canvas-caption font-semibold uppercase tracking-wider text-canvas-muted">
        {title}
      </p>
      <div className="rounded-canvas border border-canvas-border bg-canvas-card p-4">
        {children}
      </div>
    </section>
  );
}

/**
 * Static specimens that inherit the live CSS variables — they restyle
 * instantly as the controls change. (The whole app does too; this simply
 * keeps the key shapes in view while tweaking.)
 */
export function LivePreview() {
  return (
    <div className="flex flex-col gap-6">
      <PreviewCard title="Buttons — variants × tones">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary">Primary action</Button>
            <Button>Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link action</Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary" tone="danger" icon={Trash2}>
              Delete canvas
            </Button>
            <Button tone="danger">Leave canvas</Button>
            <Button variant="ghost" tone="danger">
              Remove
            </Button>
            <Button variant="link" tone="danger">
              Discard draft
            </Button>
          </div>
        </div>
      </PreviewCard>

      <PreviewCard title="Buttons — sizes, shapes, states">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
            <IconButton icon={Plus} label="Add" size="sm" />
            <IconButton icon={Plus} label="Add" size="md" />
            <IconButton icon={Plus} label="Add" size="lg" />
            <CloseButton />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary" shape="pill" size="lg">
              Pill primary
            </Button>
            <Button shape="pill">Pill secondary</Button>
            <Button variant="primary" icon={Plus}>
              With icon
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary" disabled>
              Disabled
            </Button>
            <Button disabled>Disabled</Button>
            <Button variant="primary" loading>
              Saving
            </Button>
          </div>
        </div>
      </PreviewCard>

      <PreviewCard title="Chips">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-canvas-artifactIconBg px-3 py-1 text-canvas-caption font-medium text-canvas-accent">
            Accent chip
          </span>
          <span className="rounded-full border border-canvas-border bg-canvas-card px-3 py-1 text-canvas-caption font-medium text-canvas-secondary">
            Secondary chip
          </span>
          <span className="rounded-full border border-canvas-border bg-canvas-card px-3 py-1 text-canvas-caption font-medium text-canvas-tertiary">
            Accent 2 chip
          </span>
        </div>
      </PreviewCard>

      <PreviewCard title="Artifact headers">
        <div className="flex flex-col gap-3">
          {ARTIFACT_CATEGORY_IDS.map((category) => {
            const meta = ARTIFACT_CATEGORY_META[category];
            const kind = meta.kinds[0];
            return (
              <div key={category} className="flex items-center gap-3">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                  style={artifactCategoryStyle(kind)}
                >
                  <ArtifactTypeIcon kind={kind} className="h-[22px] w-[22px]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-canvas-body font-medium text-canvas-ink">
                    {meta.label}
                  </span>
                  <span className="block text-canvas-caption text-canvas-muted">
                    {meta.kinds.join(" · ")}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      </PreviewCard>

      <PreviewCard title="Menu / popover">
        <div className="w-64 rounded-canvas border border-canvas-border bg-canvas-card py-1">
          {["Rename", "Duplicate", "Export"].map((item) => (
            <button
              key={item}
              type="button"
              className="flex w-full items-center px-3 py-2 text-left text-canvas-body-sm text-canvas-ink transition-colors hover:bg-canvas-bg"
            >
              {item}
            </button>
          ))}
          <div className="mx-3 my-1 border-t border-canvas-border" />
          <button
            type="button"
            className="flex w-full items-center px-3 py-2 text-left text-canvas-body-sm text-canvas-danger transition-colors hover:bg-canvas-danger-soft"
          >
            Delete
          </button>
        </div>
      </PreviewCard>

      <PreviewCard title="Type scale">
        <div className="flex flex-col gap-1.5">
          <p className="text-canvas-heading font-medium">Heading — 18px</p>
          <p className="text-canvas-body">Body — 14px. The core reading size.</p>
          <p className="text-canvas-body-sm">Body small — 13px. Dense chrome.</p>
          <p className="text-canvas-compact">Compact — 12px. Buttons, chips.</p>
          <p className="text-canvas-caption text-canvas-muted">
            Caption — 11px. Metadata and labels.
          </p>
        </div>
      </PreviewCard>
    </div>
  );
}
