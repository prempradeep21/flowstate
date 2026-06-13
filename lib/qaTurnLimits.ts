/** Hard cap for a single Q&A turn (LLM stream + artifact materialization). */
export const QA_TURN_TIMEOUT_MS = 3 * 60 * 1000;

export const QA_TURN_TIMEOUT_SECONDS = QA_TURN_TIMEOUT_MS / 1000;
