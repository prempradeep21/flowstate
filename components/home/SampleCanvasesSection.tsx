"use client";

import { PaginatedGrid, type GridSlot } from "@/components/home/PaginatedGrid";
import { SampleCanvasCard } from "@/components/home/SampleCanvasCard";
import { SectionHeading } from "@/components/home/SectionHeading";
import { SAMPLE_CANVASES } from "@/lib/home/sampleCanvases";

const slots: GridSlot[] = SAMPLE_CANVASES.map((sample) => ({
  key: sample.slug,
  node: <SampleCanvasCard sample={sample} />,
}));

export function SampleCanvasesSection() {
  return (
    <section className="mt-12 pb-10">
      <SectionHeading title="Sample canvases" />
      <PaginatedGrid slots={slots} />
    </section>
  );
}
