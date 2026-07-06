import { clampOnboardingStepIndex } from "@/lib/onboardingTour";

export const ONBOARDING_PREVIEW_SESSION_KEY = "flowstate-onboarding-preview";

export interface OnboardingPreviewParams {
  forceStart: boolean;
  reset: boolean;
  initialStep: number;
}

export function isLocalhostDev(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
}

export function isOnboardingPreviewAllowed(): boolean {
  if (typeof window === "undefined") return false;
  return process.env.NODE_ENV !== "production" || isLocalhostDev();
}

export function parseOnboardingPreviewFromSearch(
  search: string,
): OnboardingPreviewParams {
  const params = new URLSearchParams(search);
  const onboarding = params.get("onboarding");
  const reset = onboarding === "reset";
  const forceStart = onboarding === "1" || onboarding === "true";
  const stepRaw = params.get("step");
  const initialStep =
    stepRaw != null ? clampOnboardingStepIndex(Number(stepRaw) - 1) : 0;

  return { forceStart, reset, initialStep };
}

export function isOnboardingPreviewSessionActive(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  return sessionStorage.getItem(ONBOARDING_PREVIEW_SESSION_KEY) === "1";
}

export function markOnboardingPreviewSession(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(ONBOARDING_PREVIEW_SESSION_KEY, "1");
}

export function clearOnboardingPreviewSession(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(ONBOARDING_PREVIEW_SESSION_KEY);
}

export function shouldUseOnboardingPreview(params: {
  forceStart: boolean;
  replayRequested: boolean;
}): boolean {
  if (!isOnboardingPreviewAllowed()) return false;
  if (params.forceStart || params.replayRequested) return true;
  return isOnboardingPreviewSessionActive();
}
