"use client";

import { useState } from "react";
import { ArtifactTypeIcon } from "@/components/artifacts/ArtifactTypeIcon";
import { ChatComposer } from "@/components/ChatComposer";
import { LandingTipCard } from "@/components/landing/LandingTipCard";
import { LandingQIcon, LandingZoomIcon } from "@/components/landing/LandingTipIcons";
import { BranchForkIcon } from "@/components/MenuIcons";
import { LANDING_ARTIFACT_SUGGESTIONS } from "@/lib/landingSuggestions";
import { FollowUpOptions, useCanvasStore } from "@/lib/store";

const LANDING_WIDTH = 560;

export function CanvasLanding({ cardId }: { cardId: string }) {
  const recordUndo = useCanvasStore((s) => s.recordUndo);
  const updateCard = useCanvasStore((s) => s.updateCard);
  const card = useCanvasStore((s) => s.cards[cardId]);
  const [draft, setDraft] = useState("");

  const isPending =
    card?.status === "thinking" || card?.status === "streaming";

  const onSubmit = (question: string, options?: FollowUpOptions) => {
    const q = question.trim();
    if (!q || isPending) return;
    recordUndo();
    updateCard(cardId, {
      question: q,
      answer: "",
      status: "thinking",
      responseType: "text",
      artifactPayload: undefined,
      images: options?.pendingImages,
      outputArtifactId: undefined,
      outputArtifactVersionId: undefined,
      attachedArtifacts: options?.attachedArtifacts,
      pendingFiles: options?.pendingFiles,
    });
    setDraft("");
  };

  const focusComposer = () => {
    requestAnimationFrame(() => {
      document
        .querySelector<HTMLTextAreaElement>("[data-composer] textarea")
        ?.focus();
    });
  };

  return (
    <div
      data-canvas-landing
      className="absolute z-30 flex -translate-x-1/2 -translate-y-1/2 select-text flex-col items-center gap-6 px-6"
      style={{ left: 0, top: 0, width: LANDING_WIDTH }}
      aria-label="Start a conversation"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <h1 className="text-center font-display text-[52px] font-normal leading-[1.05] tracking-[-0.02em] text-canvas-ink sm:text-[56px]">
        What&apos;s on your mind?
      </h1>

      <div className="flex flex-wrap justify-center gap-2">
        {LANDING_ARTIFACT_SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion.kind}
            type="button"
            onClick={() => {
              setDraft(suggestion.prompt);
              focusComposer();
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-canvas-ink/20 bg-canvas-card px-4 py-1.5 text-[13px] text-canvas-muted transition-colors hover:border-canvas-ink/35 hover:text-canvas-ink"
          >
            <ArtifactTypeIcon
              kind={suggestion.kind}
              className="h-3.5 w-3.5 shrink-0"
            />
            {suggestion.label}
          </button>
        ))}
      </div>

      <ChatComposer
        variant="landing"
        cardId={cardId}
        placeholder="Ask anything"
        autoFocus
        disabled={isPending}
        draftValue={draft}
        onDraftChange={setDraft}
        onSubmit={onSubmit}
      />

      <div className="flex w-full gap-2">
        <LandingTipCard icon={<BranchForkIcon />}>
          Pull a new thread from the side plugs on an answer to explore a
          separate line of thought.
        </LandingTipCard>
        <LandingTipCard icon={<LandingQIcon className="h-4 w-4" />}>
          Press <span className="font-medium text-canvas-ink">Q</span>, then
          click on the canvas to place a new question card.
        </LandingTipCard>
        <LandingTipCard icon={<LandingZoomIcon />}>
          Scroll to zoom. Hold{" "}
          <span className="font-medium text-canvas-ink">Space</span> and drag to
          pan. Ctrl/Cmd + scroll zooms faster.
        </LandingTipCard>
      </div>
    </div>
  );
}
