"use client";

import { DesignSystemCardPreview } from "@/app/dev/design-system/DesignSystemCardPreview";
import { DESIGN_SYSTEM_CARD_SAMPLES } from "@/lib/designSystemCardSamples";

export function CardsSection() {
  return (
    <div className="grid gap-10 lg:grid-cols-2">
      {DESIGN_SYSTEM_CARD_SAMPLES.map((sample) => (
        <article key={sample.id} className="flex min-w-0 flex-col gap-4">
          <div>
            <h3 className="font-display text-canvas-heading text-canvas-ink">{sample.title}</h3>
            <p className="mt-2 text-canvas-body leading-[1.6] text-canvas-muted">
              {sample.description}
            </p>
            <p className="mt-2 font-mono text-canvas-micro text-canvas-muted">
              {sample.componentPath}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {sample.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-canvas-bg px-2 py-0.5 text-canvas-micro text-canvas-muted"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <DesignSystemCardPreview sample={sample} />
        </article>
      ))}
    </div>
  );
}
