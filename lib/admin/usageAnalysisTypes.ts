export type LikelyRegion = "India" | "US" | "Unknown";

export type UsageAnalysisSnapshot = {
  computedAt: string;
  timezone: "Asia/Kolkata";
  summary: {
    totalInputTokens: number;
    totalOutputTokens: number;
    totalTokens: number;
    usersWithUsage: number;
    totalUsers: number;
    canvasesWithUsage: number;
    topAccountEmail: string | null;
    topAccountSharePct: number;
    topTwoAccountsSharePct: number;
    topFourCanvasesSharePct: number;
  };
  accounts: UsageAnalysisAccount[];
  topCanvases: UsageAnalysisCanvas[];
  signupsByDay: Array<{ date: string; count: number }>;
  activityByDay: Array<{ date: string; canvasUpdates: number }>;
  insights: string[];
  limitations: string[];
};

export type UsageAnalysisAccount = {
  email: string;
  displayName: string | null;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  sharePct: number;
  canvasesWithUsage: number;
  lastSignInAt: string | null;
  signupAt: string;
  likelyRegion: LikelyRegion;
};

export type UsageAnalysisCanvas = {
  email: string;
  title: string;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  cardsWithUsage: number;
  updatedAt: string;
};

export type UsageAnalysisSnapshotRow = {
  id: string;
  computed_at: string;
  timezone: string;
  payload: UsageAnalysisSnapshot;
  stats: {
    total_tokens?: number;
    user_count?: number;
    duration_ms?: number;
  };
};

export const USAGE_ANALYSIS_TIMEZONE = "Asia/Kolkata" as const;

export const USAGE_ANALYSIS_LIMITATIONS = [
  "Counts only turnUsage stored in saved canvas JSON (logged-in users who persisted their canvas).",
  "Does not include anonymous chat, unsaved local sessions, or API routes without canvas persistence.",
  "Region labels are inferred from email domains — not geo-IP or Google Analytics.",
  "Per-day token trends are unavailable; cards do not store usage timestamps.",
] as const;
