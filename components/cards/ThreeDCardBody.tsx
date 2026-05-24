"use client";

import { ArtifactCardChrome } from "@/components/cards/ArtifactCardChrome";
import { ArtifactMediaViewport } from "@/components/cards/ArtifactMediaViewport";
import { TextCardBody } from "@/components/cards/TextCardBody";
import type { Card } from "@/lib/store";

interface ThreeDCardBodyProps {
  card: Card;
  isStreaming?: boolean;
}

export function ThreeDCardBody({ card, isStreaming }: ThreeDCardBodyProps) {
  const payload =
    card.artifactPayload?.type === "3d" ? card.artifactPayload : null;

  if (!payload) {
    return <TextCardBody card={card} isStreaming={isStreaming} />;
  }

  const { modelUrl, format } = payload.data;

  return (
    <div className="flex flex-col gap-3">
      {card.answer.trim() && (
        <TextCardBody card={card} isStreaming={isStreaming} />
      )}
      <ArtifactCardChrome
        type="3d"
        title={payload.title}
        description={payload.description}
      >
        <ArtifactMediaViewport className="bg-[#1a1a1a]">
          <div className="flex h-full flex-col items-center justify-center gap-2 p-4">
            <svg viewBox="0 0 120 120" className="h-24 w-24 text-white/35">
              <path
                d="M60 15 L95 35 L95 85 L60 105 L25 85 L25 35 Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
              <ellipse
                cx="60"
                cy="60"
                rx="18"
                ry="28"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
            </svg>
            {modelUrl ? (
              <a
                href={modelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="max-w-full truncate text-[12px] text-violet-300 hover:underline"
              >
                {modelUrl}
              </a>
            ) : (
              <span className="text-[13px] text-white/50">No model URL</span>
            )}
          </div>
          {format && (
            <span className="absolute bottom-2 right-2 rounded bg-black/50 px-1.5 py-0.5 text-[10px] uppercase text-white/70">
              {format}
            </span>
          )}
        </ArtifactMediaViewport>
      </ArtifactCardChrome>
    </div>
  );
}
