import type { Card } from "@/lib/store";

export type TurnUsage = { inputTokens: number; outputTokens: number };

/** Reset turn timing and usage when a question is submitted or retried. */
export function turnMetricsOnSubmit(): Pick<Card, "askStartedAt" | "turnUsage"> {
  return {
    askStartedAt: Date.now(),
    turnUsage: { inputTokens: 0, outputTokens: 0 },
  };
}

export function formatElapsedMs(ms: number): string {
  if (ms < 60_000) {
    return `${Math.max(0, Math.round(ms / 1000))}s`;
  }
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

export function formatTurnTokenCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function formatTurnUsageLine(usage: TurnUsage | undefined): string {
  const input = usage?.inputTokens ?? 0;
  const output = usage?.outputTokens ?? 0;
  return `↑ ${formatTurnTokenCount(input)} ↓ ${formatTurnTokenCount(output)} tokens`;
}
