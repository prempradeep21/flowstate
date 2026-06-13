/** Hard cap for a single Q&A turn (LLM stream + artifact materialization). */
export const QA_TURN_TIMEOUT_MS = 3 * 60 * 1000;

/** Seconds mirror for API route maxDuration (must stay aligned with app/api/chat/route.ts). */
export const QA_TURN_TIMEOUT_SECONDS = 180;
