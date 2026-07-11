/**
 * Q&A turn timeout gate.
 *
 * Client code (Card watchdog, claudeClient abort) only sees NEXT_PUBLIC_* vars.
 * Server routes may also honor QA_TURN_TIMEOUT_ENABLED.
 */
export function isQaTurnTimeoutEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_QA_TURN_TIMEOUT_ENABLED === "false") {
    return false;
  }
  if (process.env.QA_TURN_TIMEOUT_ENABLED === "false") {
    return false;
  }
  return true;
}

export const QA_TURN_TIMEOUT_ENABLED = isQaTurnTimeoutEnabled();

/** Hard cap for a single Q&A turn (LLM stream + artifact work) when enabled. */
export const QA_TURN_TIMEOUT_MS = 3 * 60 * 1000;

/** Seconds mirror for API route maxDuration when timeout is enabled. */
export const QA_TURN_TIMEOUT_SECONDS = 180;

/** Custom UI builds — matches existing maxDuration on /api/custom-ui (300s). */
export const CUSTOM_UI_TURN_TIMEOUT_MS = 5 * 60 * 1000;

export const CUSTOM_UI_TURN_TIMEOUT_SECONDS = 300;

/** Active turn timeout: longer for custom UI, default for other Q&A. */
export function getActiveTurnTimeoutMs(isCustomUi: boolean): number {
  if (!QA_TURN_TIMEOUT_ENABLED) return 0;
  return isCustomUi ? CUSTOM_UI_TURN_TIMEOUT_MS : QA_TURN_TIMEOUT_MS;
}

export function turnTimeoutMinutes(isCustomUi: boolean): number {
  return isCustomUi
    ? CUSTOM_UI_TURN_TIMEOUT_SECONDS / 60
    : QA_TURN_TIMEOUT_SECONDS / 60;
}

/** Generous server limit when client timeout is disabled (local SDK runs). */
export const QA_TURN_MAX_DURATION_SECONDS = QA_TURN_TIMEOUT_ENABLED
  ? QA_TURN_TIMEOUT_SECONDS
  : 900;

/** No hard cap on client/server timers while disabled (SDK subagent runs). */
export const QA_TURN_TIMEOUT_MS_ACTIVE = QA_TURN_TIMEOUT_ENABLED
  ? QA_TURN_TIMEOUT_MS
  : 0;
