import {
  getBranchParentThreadId,
  getThreadRootCard,
  type ChatThreadState,
} from "@/lib/chatThreads";
import type { Card } from "@/lib/store";

/** Idle time before a thread auto-collapses on the canvas. */
export const INACTIVITY_MS = 5 * 60 * 1000;

export interface ThreadInactivityState extends ChatThreadState {
  collapsedCardIds: string[];
}

const lastActivityAt = new Map<string, number>();
let collapseTimerId: ReturnType<typeof setTimeout> | null = null;
let paused = false;
let applyCollapse: ((threadIds: string[]) => void) | null = null;
let readState: (() => ThreadInactivityState) | null = null;

export function registerThreadInactivityHandlers(handlers: {
  readState: () => ThreadInactivityState;
  applyCollapse: (threadIds: string[]) => void;
}): void {
  readState = handlers.readState;
  applyCollapse = handlers.applyCollapse;
}

function cardsInThread(state: ThreadInactivityState, threadId: string): Card[] {
  return state.cardOrder
    .map((id) => state.cards[id])
    .filter((c): c is Card => Boolean(c && c.threadId === threadId));
}

function threadHasPendingResponse(
  state: ThreadInactivityState,
  threadId: string,
): boolean {
  return cardsInThread(state, threadId).some(
    (c) => c.status === "thinking" || c.status === "streaming",
  );
}

/** Whether a thread is eligible for auto-collapse right now. */
export function shouldAutoCollapseThread(
  state: ThreadInactivityState,
  threadId: string,
  lastActiveAt: number,
  now: number,
): boolean {
  if (now - lastActiveAt < INACTIVITY_MS) return false;

  const root = getThreadRootCard(state, threadId);
  if (!root) return false;
  if (state.collapsedCardIds.includes(root.id)) return false;
  if (threadHasPendingResponse(state, threadId)) return false;
  if (root.status === "empty" && !root.question.trim()) return false;

  return true;
}

/** Thread ids whose inactivity window has expired and pass collapse guards. */
export function collectExpiredThreadsToCollapse(
  state: ThreadInactivityState,
  activityMap: Map<string, number>,
  now: number,
): string[] {
  const toCollapse: string[] = [];
  for (const threadId of state.threadOrder) {
    const lastActive = activityMap.get(threadId);
    if (lastActive == null) continue;
    if (shouldAutoCollapseThread(state, threadId, lastActive, now)) {
      toCollapse.push(threadId);
    }
  }
  return toCollapse;
}

export function touchThreadActivity(
  threadId: string,
  getState: () => ThreadInactivityState,
): void {
  if (!threadId) return;
  const now = Date.now();
  let tid: string | null = threadId;
  while (tid) {
    lastActivityAt.set(tid, now);
    tid = getBranchParentThreadId(getState(), tid);
  }
  scheduleNextCollapse();
}

export function resetThreadActivity(threadIds: string[], now = Date.now()): void {
  for (const threadId of threadIds) {
    lastActivityAt.set(threadId, now);
  }
  scheduleNextCollapse();
}

export function ensureThreadRegistered(threadId: string, now = Date.now()): void {
  if (!lastActivityAt.has(threadId)) {
    lastActivityAt.set(threadId, now);
    scheduleNextCollapse();
  }
}

export function getThreadLastActivityMap(): ReadonlyMap<string, number> {
  return lastActivityAt;
}

function getNextExpiryMs(now: number): number | null {
  let earliest: number | null = null;
  for (const lastActive of lastActivityAt.values()) {
    const expiry = lastActive + INACTIVITY_MS;
    if (expiry <= now) return 0;
    if (earliest == null || expiry < earliest) earliest = expiry;
  }
  return earliest;
}

export function scheduleNextCollapse(): void {
  if (collapseTimerId != null) {
    clearTimeout(collapseTimerId);
    collapseTimerId = null;
  }
  if (paused || !readState || !applyCollapse) return;

  const now = Date.now();
  const nextExpiry = getNextExpiryMs(now);
  if (nextExpiry == null) return;

  const delay = Math.max(0, nextExpiry - now);
  collapseTimerId = setTimeout(() => {
    collapseTimerId = null;
    runCollapsePass();
  }, delay);
}

export function runCollapsePass(): void {
  if (paused || !readState || !applyCollapse) {
    scheduleNextCollapse();
    return;
  }

  const state = readState();
  const now = Date.now();
  const toCollapse = collectExpiredThreadsToCollapse(state, lastActivityAt, now);
  if (toCollapse.length > 0) {
    applyCollapse(toCollapse);
  }
  scheduleNextCollapse();
}

export function setThreadInactivityPaused(isPaused: boolean): void {
  paused = isPaused;
  if (paused && collapseTimerId != null) {
    clearTimeout(collapseTimerId);
    collapseTimerId = null;
  } else if (!paused) {
    scheduleNextCollapse();
  }
}

export function startThreadInactivityScheduler(): void {
  scheduleNextCollapse();
}

export function disposeThreadInactivity(): void {
  if (collapseTimerId != null) {
    clearTimeout(collapseTimerId);
    collapseTimerId = null;
  }
  paused = false;
}

/** Test-only reset of module state. */
export function resetThreadInactivityModuleForTests(): void {
  lastActivityAt.clear();
  if (collapseTimerId != null) {
    clearTimeout(collapseTimerId);
    collapseTimerId = null;
  }
  paused = false;
  applyCollapse = null;
  readState = null;
}
