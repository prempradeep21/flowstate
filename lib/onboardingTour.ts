export type OnboardingTourTarget =
  | "ask-composer"
  | "add-btn"
  | "artefact-btn"
  | "share-btn"
  | "artifacts-panel-entry"
  | "left-sidebar-entry";

export interface OnboardingTourStep {
  id: string;
  target: OnboardingTourTarget;
  title: string;
  lines: [string, string];
}

export const ONBOARDING_TOUR_STEP_COUNT = 6;

export const ONBOARDING_TOUR_STEPS: readonly OnboardingTourStep[] = [
  {
    id: "ask",
    target: "ask-composer",
    title: "Start a conversation",
    lines: [
      "Ask anything to get started.",
      "Every answer becomes a card you can follow up on or branch from.",
    ],
  },
  {
    id: "add-inputs",
    target: "add-btn",
    title: "Add inputs",
    lines: [
      "Bring images, documents, code, text, and more onto the canvas.",
      "Use them as reference while you chat and build artifacts.",
    ],
  },
  {
    id: "artifacts",
    target: "artefact-btn",
    title: "Artifacts",
    lines: [
      "Artifacts are structured outputs — tables, notes, charts, and more.",
      "Build them on the canvas and reuse them whenever you need.",
    ],
  },
  {
    id: "share",
    target: "share-btn",
    title: "Share your canvas",
    lines: [
      "Invite teammates to view or edit with you.",
      "Share a link and work on the same board together.",
    ],
  },
  {
    id: "artifact-library-entry",
    target: "artifacts-panel-entry",
    title: "Your library",
    lines: [
      "Open this to browse artifacts, assets, and skills from your canvas.",
      "Reopen anything you've made or drag it back onto the board.",
    ],
  },
  {
    id: "left-sidebar-entry",
    target: "left-sidebar-entry",
    title: "Your canvases",
    lines: [
      "Open the sidebar to switch canvases, create new ones, or rename what you're working on.",
      "Cloud save, sign-in, and account settings live here too.",
    ],
  },
] as const;

export function coachTargetSelector(target: OnboardingTourTarget): string {
  return `[data-coach-target="${target}"]`;
}

export function isOnboardingTourEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ONBOARDING_TOUR_ENABLED === "true";
}

export interface ShouldShowOnboardingTourInput {
  user: { id: string } | null;
  authLoading: boolean;
  isSwitchingCanvas: boolean;
  hasCompletedOnboardingTour: boolean;
  previewActive: boolean;
  viewMode: "canvas" | "chat" | "focus";
}

export function shouldShowOnboardingTour(
  input: ShouldShowOnboardingTourInput,
): boolean {
  if (input.viewMode !== "canvas") return false;
  if (input.authLoading || input.isSwitchingCanvas) return false;
  if (input.previewActive) return true;
  if (!isOnboardingTourEnabled()) return false;
  if (!input.user) return false;
  if (input.hasCompletedOnboardingTour) return false;
  return true;
}

export function clampOnboardingStepIndex(index: number): number {
  if (!Number.isFinite(index)) return 0;
  return Math.min(
    Math.max(0, Math.floor(index)),
    ONBOARDING_TOUR_STEP_COUNT - 1,
  );
}
