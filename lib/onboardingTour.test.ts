import { describe, expect, it, vi, afterEach } from "vitest";
import {
  clampOnboardingStepIndex,
  ONBOARDING_TOUR_STEPS,
  shouldShowOnboardingTour,
  isOnboardingTourEnabled,
} from "@/lib/onboardingTour";
import { parseOnboardingPreviewFromSearch } from "@/lib/onboardingTourDev";

describe("ONBOARDING_TOUR_STEPS", () => {
  it("defines six steps in the planned order", () => {
    expect(ONBOARDING_TOUR_STEPS).toHaveLength(6);
    expect(ONBOARDING_TOUR_STEPS.map((s) => s.target)).toEqual([
      "ask-composer",
      "add-btn",
      "artefact-btn",
      "share-btn",
      "artifacts-panel-entry",
      "left-sidebar-entry",
    ]);
  });

  it("uses unique step ids", () => {
    const ids = ONBOARDING_TOUR_STEPS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("shouldShowOnboardingTour", () => {
  const base = {
    user: { id: "user-1" },
    authLoading: false,
    isSwitchingCanvas: false,
    hasCompletedOnboardingTour: false,
    previewActive: false,
    viewMode: "canvas" as const,
  };

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("shows for first-time logged-in users when enabled", () => {
    vi.stubEnv("NEXT_PUBLIC_ONBOARDING_TOUR_ENABLED", "true");
    expect(isOnboardingTourEnabled()).toBe(true);
    expect(shouldShowOnboardingTour(base)).toBe(true);
  });

  it("hides when feature flag is off and not in preview", () => {
    vi.stubEnv("NEXT_PUBLIC_ONBOARDING_TOUR_ENABLED", "false");
    expect(shouldShowOnboardingTour(base)).toBe(false);
  });

  it("shows when preview is active regardless of completion", () => {
    expect(
      shouldShowOnboardingTour({
        ...base,
        previewActive: true,
        hasCompletedOnboardingTour: true,
        user: null,
      }),
    ).toBe(true);
  });

  it("hides when auth is loading, switching canvas, or in chat view", () => {
    expect(
      shouldShowOnboardingTour({ ...base, previewActive: true, authLoading: true }),
    ).toBe(false);
    expect(
      shouldShowOnboardingTour({
        ...base,
        previewActive: true,
        isSwitchingCanvas: true,
      }),
    ).toBe(false);
    expect(
      shouldShowOnboardingTour({
        ...base,
        previewActive: true,
        viewMode: "chat",
      }),
    ).toBe(false);
  });
});

describe("clampOnboardingStepIndex", () => {
  it("clamps invalid and out-of-range values", () => {
    expect(clampOnboardingStepIndex(NaN)).toBe(0);
    expect(clampOnboardingStepIndex(-3)).toBe(0);
    expect(clampOnboardingStepIndex(99)).toBe(5);
    expect(clampOnboardingStepIndex(2)).toBe(2);
  });
});

describe("parseOnboardingPreviewFromSearch", () => {
  it("parses force start and step index", () => {
    expect(parseOnboardingPreviewFromSearch("?onboarding=1&step=3")).toEqual({
      forceStart: true,
      reset: false,
      initialStep: 2,
    });
  });

  it("parses reset", () => {
    expect(parseOnboardingPreviewFromSearch("?onboarding=reset")).toEqual({
      forceStart: false,
      reset: true,
      initialStep: 0,
    });
  });

  it("clamps invalid step values", () => {
    expect(parseOnboardingPreviewFromSearch("?onboarding=1&step=99").initialStep).toBe(
      5,
    );
    expect(parseOnboardingPreviewFromSearch("?onboarding=1&step=0").initialStep).toBe(
      0,
    );
  });
});
