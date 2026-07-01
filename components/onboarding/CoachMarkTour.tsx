"use client";

import { CoachMarkTourView } from "@/components/onboarding/CoachMarkTourView";
import { useOnboardingTour } from "@/components/onboarding/useOnboardingTour";

export function CoachMarkTour() {
  const tour = useOnboardingTour();
  return <CoachMarkTourView {...tour} />;
}
