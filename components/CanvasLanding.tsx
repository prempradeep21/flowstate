"use client";

import { useEffect, useState } from "react";
import { AuthButton } from "@/components/AuthButton";
import { useAuth } from "@/components/AuthProvider";
import { ArtifactTypeIcon } from "@/components/artifacts/ArtifactTypeIcon";
import { ChatComposer } from "@/components/ChatComposer";
import { LandingTipCard } from "@/components/landing/LandingTipCard";
import { RotatingLandingTitle } from "@/components/landing/RotatingLandingTitle";
import { LandingQIcon, LandingZoomIcon } from "@/components/landing/LandingTipIcons";
import { BranchForkIcon } from "@/components/MenuIcons";
import {
  hasLandingAnimated,
  markLandingAnimated,
} from "@/lib/motion/performance";
import { LANDING_STACK_WIDTH } from "@/lib/canvasLandingState";
import { LANDING_ARTIFACT_SUGGESTIONS } from "@/lib/landingSuggestions";
import { turnMetricsOnSubmit } from "@/lib/qaTurnMetrics";
import { FollowUpOptions, useCanvasStore } from "@/lib/store";

const PILL_DELAYS = [280, 320, 360, 400, 440] as const;
const TIP_DELAYS = [640, 675, 710] as const;

export function CanvasLanding({ cardId }: { cardId: string }) {
  const { user, authLoading } = useAuth();
  const recordUndo = useCanvasStore((s) => s.recordUndo);
  const updateCard = useCanvasStore((s) => s.updateCard);
  const card = useCanvasStore((s) => s.cards[cardId]);
  const [draft, setDraft] = useState("");
  const [skipMotion, setSkipMotion] = useState(false);
  const showSignIn = !authLoading && !user;

  useEffect(() => {
    if (hasLandingAnimated()) {
      setSkipMotion(true);
      return;
    }
    markLandingAnimated();
  }, []);

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
      thinkingLabel: "Thinking",
      responseType: "text",
      artifactPayload: undefined,
      attachedImages: options?.pendingImages,
      images: undefined,
      outputArtifactId: undefined,
      outputArtifactVersionId: undefined,
      attachedArtifacts: options?.attachedArtifacts,
      pendingFiles: options?.pendingFiles,
      ...turnMetricsOnSubmit(),
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

  const riseProps = (delay: number) =>
    skipMotion
      ? {}
      : {
          className: "motion-landing-rise",
          style: { animationDelay: `${delay}ms` } as const,
        };

  return (
    <div
      data-canvas-landing
      className={`absolute z-30 flex -translate-x-1/2 -translate-y-1/2 select-text flex-col items-center gap-6 px-6 ${
        skipMotion ? "motion-landing-skip" : ""
      }`}
      style={{ left: 0, top: 0, width: LANDING_STACK_WIDTH }}
      aria-label="Start a conversation"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <h1
        aria-live="polite"
        className="min-h-[1.15em] text-center font-display text-canvas-display font-normal leading-[1.05] tracking-[-0.02em] text-canvas-ink sm:text-canvas-display"
      >
        <span
          className={riseProps(0).className}
          style={riseProps(0).style}
        >
          <RotatingLandingTitle />
        </span>
      </h1>

      {showSignIn && (
        <div
          className={riseProps(120).className}
          style={riseProps(120).style}
        >
          <AuthButton />
        </div>
      )}

      <div className="flex w-full max-w-full flex-nowrap justify-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {LANDING_ARTIFACT_SUGGESTIONS.map((suggestion, i) => (
          <button
            key={suggestion.kind}
            type="button"
            onClick={() => {
              setDraft(suggestion.prompt);
              focusComposer();
            }}
            className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-canvas-ink/20 bg-canvas-card px-3 py-1.5 text-canvas-compact text-canvas-muted transition-colors hover:border-canvas-ink/35 hover:text-canvas-ink ${riseProps(PILL_DELAYS[i]).className ?? ""}`}
            style={riseProps(PILL_DELAYS[i]).style}
          >
            <ArtifactTypeIcon
              kind={suggestion.kind}
              className="h-3.5 w-3.5 shrink-0"
            />
            {suggestion.label}
          </button>
        ))}
      </div>

      <div
        className={riseProps(500).className}
        style={{ width: "100%", ...riseProps(500).style }}
      >
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
      </div>

      <div className="flex w-full gap-2">
        <div
          className={riseProps(TIP_DELAYS[0]).className}
          style={{ flex: 1, ...riseProps(TIP_DELAYS[0]).style }}
        >
          <LandingTipCard icon={<BranchForkIcon />}>
            Pull a new thread from the side plugs on an answer to explore a
            separate line of thought.
          </LandingTipCard>
        </div>
        <div
          className={riseProps(TIP_DELAYS[1]).className}
          style={{ flex: 1, ...riseProps(TIP_DELAYS[1]).style }}
        >
          <LandingTipCard icon={<LandingQIcon className="h-4 w-4" />}>
            Press <span className="font-medium text-canvas-ink">Q</span>, then
            click on the canvas to place a new question card.
          </LandingTipCard>
        </div>
        <div
          className={riseProps(TIP_DELAYS[2]).className}
          style={{ flex: 1, ...riseProps(TIP_DELAYS[2]).style }}
        >
          <LandingTipCard icon={<LandingZoomIcon />}>
            Scroll to zoom. Hold{" "}
            <span className="font-medium text-canvas-ink">Space</span> and drag to
            pan. Ctrl/Cmd + scroll zooms faster.
          </LandingTipCard>
        </div>
      </div>
    </div>
  );
}
