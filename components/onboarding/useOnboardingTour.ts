"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  coachTargetSelector,
  ONBOARDING_TOUR_STEPS,
  shouldShowOnboardingTour,
} from "@/lib/onboardingTour";
import {
  clearOnboardingPreviewSession,
  markOnboardingPreviewSession,
  parseOnboardingPreviewFromSearch,
  shouldUseOnboardingPreview,
} from "@/lib/onboardingTourDev";
import {
  CoachMarkCenteredBackdrop,
  CoachMarkPopover,
  CoachMarkSpotlight,
  measureCoachTarget,
  popoverPlacement,
  type SpotlightRect,
} from "@/components/onboarding/CoachMarkPopover";
import { useAuth } from "@/components/AuthProvider";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  fetchUserPreferences,
  updateOnboardingTourCompleted,
} from "@/lib/canvasPersistence";
import { useCanvasStore } from "@/lib/store";
import { showAppToast } from "@/lib/appToastStore";

const START_DELAY_MS = 400;
const ARTIFACTS_PANEL_ENTRY_STEP_INDEX = 4;
const LEFT_SIDEBAR_ENTRY_STEP_INDEX = 5;
const PANEL_LAYOUT_SETTLE_MS = 150;

export function useOnboardingTour() {
  const { user, authLoading, isSwitchingCanvas } = useAuth();
  const viewMode = useCanvasStore((s) => s.viewMode);
  const setRightPanelCollapsed = useCanvasStore((s) => s.setRightPanelCollapsed);
  const setLeftPanelCollapsed = useCanvasStore((s) => s.setLeftPanelCollapsed);

  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(null);
  const [centered, setCentered] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(true);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [layoutNonce, setLayoutNonce] = useState(0);

  const completingRef = useRef(false);
  const startedRef = useRef(false);

  const refreshSpotlight = useCallback(() => {
    const step = ONBOARDING_TOUR_STEPS[stepIndex];
    if (!step) return;

    if (step.target === "share-btn") {
      const shareRect = measureCoachTarget(coachTargetSelector("share-btn"));
      if (!shareRect) {
        setCentered(true);
        setSpotlightRect(null);
        return;
      }
    }

    const rect = measureCoachTarget(coachTargetSelector(step.target));
    if (rect) {
      setCentered(false);
      setSpotlightRect(rect);
      return;
    }

    if (step.target === "share-btn") {
      setCentered(true);
      setSpotlightRect(null);
      return;
    }

    setCentered(false);
    setSpotlightRect(rect);
  }, [stepIndex, layoutNonce]);

  const enterStep = useCallback(
    (index: number) => {
      if (index >= ARTIFACTS_PANEL_ENTRY_STEP_INDEX) {
        setRightPanelCollapsed(true);
      }
      if (index >= LEFT_SIDEBAR_ENTRY_STEP_INDEX) {
        setLeftPanelCollapsed(true);
      }
      setStepIndex(index);
      window.setTimeout(
        () => setLayoutNonce((nonce) => nonce + 1),
        PANEL_LAYOUT_SETTLE_MS,
      );
    },
    [setLeftPanelCollapsed, setRightPanelCollapsed],
  );

  const finishTour = useCallback(async () => {
    if (completingRef.current) return;
    completingRef.current = true;
    setActive(false);
    startedRef.current = false;
    document.documentElement.removeAttribute("data-onboarding-tour-active");
    document.documentElement.classList.remove("onboarding-tour-active");

    if (previewMode) {
      completingRef.current = false;
      return;
    }

    if (user && isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        await updateOnboardingTourCompleted(supabase, user.id);
        setHasCompleted(true);
      } catch {
        showAppToast("Could not save tour progress.", "error");
      }
    }

    completingRef.current = false;
  }, [previewMode, user]);

  const handleSkip = useCallback(() => {
    void finishTour();
  }, [finishTour]);

  const handleNext = useCallback(() => {
    if (stepIndex >= ONBOARDING_TOUR_STEPS.length - 1) {
      void finishTour();
      return;
    }
    enterStep(stepIndex + 1);
  }, [enterStep, finishTour, stepIndex]);

  const handleBack = useCallback(() => {
    if (stepIndex <= 0) return;
    enterStep(stepIndex - 1);
  }, [enterStep, stepIndex]);

  const startTour = useCallback(
    (initialStep: number, preview: boolean) => {
      if (preview) {
        markOnboardingPreviewSession();
      }
      setPreviewMode(preview);
      setActive(true);
      startedRef.current = true;
      document.documentElement.setAttribute("data-onboarding-tour-active", "1");
      document.documentElement.classList.add("onboarding-tour-active");
      enterStep(initialStep);
    },
    [enterStep],
  );

  useEffect(() => {
    if (!user || !isSupabaseConfigured()) {
      setHasCompleted(false);
      setPrefsLoaded(true);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const supabase = createClient();
        const prefs = await fetchUserPreferences(supabase, user.id);
        if (!cancelled) {
          setHasCompleted(Boolean(prefs.hasCompletedOnboardingTour));
          setPrefsLoaded(true);
        }
      } catch {
        if (!cancelled) {
          setHasCompleted(false);
          setPrefsLoaded(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const { reset, forceStart, initialStep } = parseOnboardingPreviewFromSearch(
      window.location.search,
    );

    if (reset) {
      clearOnboardingPreviewSession();
      showAppToast(
        "Tour reset for this session. Clear hasCompletedOnboardingTour in Supabase to test first-login persistence.",
      );
      const url = new URL(window.location.href);
      url.searchParams.delete("onboarding");
      window.history.replaceState({}, "", url.pathname + url.search);
      return;
    }

    if (
      forceStart &&
      shouldUseOnboardingPreview({ forceStart: true, replayRequested: false })
    ) {
      const timer = window.setTimeout(() => {
        startTour(initialStep, true);
      }, START_DELAY_MS);
      return () => window.clearTimeout(timer);
    }
  }, [startTour]);

  useEffect(() => {
    if (!prefsLoaded || startedRef.current) return;

    const previewFromSession = shouldUseOnboardingPreview({
      forceStart: false,
      replayRequested: false,
    });

    const shouldStart = shouldShowOnboardingTour({
      user,
      authLoading,
      isSwitchingCanvas,
      hasCompletedOnboardingTour: hasCompleted,
      previewActive: previewFromSession,
      viewMode,
    });

    if (!shouldStart) return;

    const timer = window.setTimeout(() => {
      startTour(0, previewFromSession);
    }, START_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [
    authLoading,
    hasCompleted,
    isSwitchingCanvas,
    prefsLoaded,
    startTour,
    user,
    viewMode,
  ]);

  useEffect(() => {
    if (!active) return;
    const raf = window.requestAnimationFrame(refreshSpotlight);
    return () => window.cancelAnimationFrame(raf);
  }, [active, refreshSpotlight, stepIndex]);

  useEffect(() => {
    if (!active) return;

    const onLayout = () => refreshSpotlight();
    window.addEventListener("resize", onLayout);
    window.addEventListener("scroll", onLayout, true);

    const observer = new ResizeObserver(onLayout);
    observer.observe(document.documentElement);

    const interval = window.setInterval(refreshSpotlight, 400);

    return () => {
      window.removeEventListener("resize", onLayout);
      window.removeEventListener("scroll", onLayout, true);
      observer.disconnect();
      window.clearInterval(interval);
    };
  }, [active, refreshSpotlight]);

  useEffect(() => {
    if (viewMode === "chat" && active) {
      useCanvasStore.getState().setViewMode("canvas");
    }
  }, [active, viewMode]);

  useEffect(() => {
    return () => {
      document.documentElement.removeAttribute("data-onboarding-tour-active");
    document.documentElement.classList.remove("onboarding-tour-active");
    };
  }, []);

  const step = ONBOARDING_TOUR_STEPS[stepIndex];
  const popover = step
    ? popoverPlacement(spotlightRect, centered)
    : {
        top: 0,
        left: 0,
        placement: "center" as const,
        translateX: "-50%",
        translateY: "-50%",
      };

  return {
    active,
    step,
    stepIndex,
    spotlightRect,
    centered,
    popover,
    handleBack,
    handleNext,
    handleSkip,
  };
}
