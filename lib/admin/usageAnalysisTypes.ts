export type LikelyRegion = "India" | "US" | "Unknown";

export type UsageAnalysisSnapshot = {
  computedAt: string;
  timezone: "Asia/Kolkata";
  summary: {
    totalInputTokens: number;
    totalOutputTokens: number;
    totalTokens: number;
    /** Cached prefix tokens read back at ~10% cost (prompt caching). */
    totalCacheReadTokens: number;
    /** Tokens written to cache on a miss (one-time ~25% surcharge). */
    totalCacheCreationTokens: number;
    /** Billing-equivalent input saved by caching vs. paying full price. */
    cacheSavingsPct: number;
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
  /**
   * Anonymous (non-logged-in) visitor analytics from `visitor_events`. Optional
   * so snapshots taken before this shipped still deserialize cleanly.
   */
  visitors?: VisitorAnalytics | null;
  insights: string[];
  limitations: string[];
};

export type VisitorAnalytics = {
  /** Lookback window in days used for every figure below. */
  windowDays: number;
  /** Distinct visitor cookies seen (logged-out only). */
  uniqueVisitors: number;
  /** Total anonymous page views in the window. */
  pageViews: number;
  /** Unique visitors seen in the trailing 24h. */
  uniqueVisitorsToday: number;
  topCountry: { name: string; count: number } | null;
  topSource: { name: string; count: number } | null;
  /** Unique visitors grouped by ISO country, most first. */
  byCountry: Array<{ code: string; name: string; count: number }>;
  /** Unique visitors grouped by coarse world region. */
  byWorldRegion: Array<{ region: string; count: number }>;
  /** Unique visitors grouped by first-touch source, most first. */
  bySource: Array<{ source: string; count: number }>;
  /** Per-day unique visitors + page views across the window. */
  byDay: Array<{ date: string; visitors: number; pageViews: number }>;
};

export type UsageAnalysisAccount = {
  email: string;
  displayName: string | null;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
  totalTokens: number;
  sharePct: number;
  canvasesWithUsage: number;
  lastActiveAt: string | null;
  signupAt: string;
  likelyRegion: LikelyRegion;
};

export type UsageAnalysisCanvas = {
  email: string;
  title: string;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
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

/**
 * Anthropic prompt-caching price multipliers relative to base input token
 * price: cache reads bill at ~10%, cache writes at ~125% (one-time). Used to
 * express cache savings in "full-price-input-equivalent" tokens.
 */
export const CACHE_READ_COST_MULTIPLIER = 0.1;
export const CACHE_WRITE_COST_MULTIPLIER = 1.25;

export const USAGE_ANALYSIS_LIMITATIONS = [
  "Counts only turnUsage stored in saved canvas JSON (logged-in users who persisted their canvas).",
  "Does not include anonymous chat, unsaved local sessions, or API routes without canvas persistence.",
  "Region labels are inferred from email domains — not geo-IP or Google Analytics.",
  "Per-day token trends are unavailable; cards do not store usage timestamps.",
  "Cache read/write tokens only exist for turns generated after prompt caching shipped — older turns show zero cache activity.",
  "Last active is the latest canvas save or profile update — not sign-in time or live presence.",
  "Anonymous visitor geo comes from Vercel edge headers (production only) and unique counts approximate people via a first-party cookie, so clearing cookies or blocking them undercounts.",
] as const;
