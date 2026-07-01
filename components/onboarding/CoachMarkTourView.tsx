"use client";

import {
  CoachMarkCenteredBackdrop,
  CoachMarkPopover,
  CoachMarkSpotlight,
} from "@/components/onboarding/CoachMarkPopover";
import { ONBOARDING_TOUR_STEPS } from "@/lib/onboardingTour";
import type { useOnboardingTour } from "@/components/onboarding/useOnboardingTour";

type CoachMarkTourViewProps = ReturnType<typeof useOnboardingTour>;

export function CoachMarkTourView({
  active,
  step,
  stepIndex,
  spotlightRect,
  centered,
  popover,
  handleBack,
  handleNext,
  handleSkip,
}: CoachMarkTourViewProps) {
  if (!active || !step) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[70]">
      {centered ? (
        <CoachMarkCenteredBackdrop />
      ) : spotlightRect ? (
        <CoachMarkSpotlight rect={spotlightRect} />
      ) : (
        <CoachMarkCenteredBackdrop />
      )}

      <div
        className="pointer-events-auto fixed inset-0 z-[69]"
        aria-hidden
        onClick={(e) => e.stopPropagation()}
      />

      <CoachMarkPopover
        step={step}
        stepIndex={stepIndex}
        stepCount={ONBOARDING_TOUR_STEPS.length}
        placement={popover.placement}
        style={{ top: popover.top, left: popover.left }}
        translateX={popover.translateX}
        translateY={popover.translateY}
        onBack={handleBack}
        onNext={handleNext}
        onSkip={handleSkip}
        canGoBack={stepIndex > 0}
        isLastStep={stepIndex === ONBOARDING_TOUR_STEPS.length - 1}
      />
    </div>
  );
}
