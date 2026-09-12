"use client";

import { SectionHeading } from "@/components/home/SectionHeading";
import { UseCaseVideoCard } from "@/components/home/UseCaseVideoCard";
import { USE_CASE_VIDEOS } from "@/lib/home/useCaseVideos";

export function WhatYouCanDoSection() {
  return (
    <section className="mt-12">
      <SectionHeading title="What you can do on Flowstate" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {USE_CASE_VIDEOS.map((video) => (
          <UseCaseVideoCard key={video.key} video={video} />
        ))}
      </div>
    </section>
  );
}
