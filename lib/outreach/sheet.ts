import {
  STAGES,
  DECISIONS,
  videoPublicUrl,
  type Decision,
  type OutreachPodcaster,
  type PodcasterPatch,
  type Stage,
} from "@/lib/outreach/podcasters";

/**
 * The tracking sheet's shape, as pure data. The sheet ("Podcaster outreach —
 * tracking", prem@flowstatetool.com's Drive) is read and written by the
 * outreach routines through Claude's Google Sheets connector, not by this app:
 * scripts/outreach/cli.ts turns portal rows into sheet values (`sheet-export`)
 * and applies hand edits read from the sheet (`sheet-import`).
 *
 * Supabase is the portal's copy; the sheet mirrors it, except for the columns
 * a person edits by hand in the sheet (stage, decision, notes). Each sheet row
 * carries a `_sync` cell with those values as last written; a cell that no
 * longer matches it was edited in the sheet, and that edit wins.
 */

export const LEADS_TAB = "Leads";
export const EXCLUDED_TAB = "Excluded";
export const RUNS_TAB = "Runs";

export const EXCLUDED_HEADER = ["checked_on", "name", "url", "reason", "run_id", "notes"];
export const RUNS_HEADER = ["run_id", "date", "niches", "markets", "added", "summary"];

type SyncedValues = { stage: string; decision: string; notes: string };

const lines = (items: string[]) => items.filter(Boolean).join("\n");

/** One sheet column per field; the JSON groups are flattened to readable text. */
const LEAD_COLUMNS: { header: string; get: (r: OutreachPodcaster, byId: Map<string, OutreachPodcaster>) => string | number }[] = [
  { header: "id", get: (r) => r.id },
  { header: "podcast_key", get: (r) => r.podcast_key ?? "" },
  { header: "stage", get: (r) => r.stage },
  { header: "decision", get: (r) => r.decision ?? "" },
  { header: "example_canvas_from", get: (r, byId) => (r.example_canvas_from ? (byId.get(r.example_canvas_from)?.podcast_name ?? r.example_canvas_from) : "") },
  { header: "added_on", get: (r) => r.added_on ?? r.created_at.slice(0, 10) },
  { header: "run_id", get: (r) => r.run_id ?? "" },
  { header: "source", get: (r) => r.source },
  { header: "lane", get: (r) => r.lane ?? "" },
  { header: "traction_tier", get: (r) => r.traction_tier ?? "" },
  { header: "podcast", get: (r) => r.podcast_name },
  { header: "host", get: (r) => r.host_name },
  { header: "podcast_url", get: (r) => r.podcast_url ?? "" },
  { header: "domain", get: (r) => r.domain ?? "" },
  { header: "niche", get: (r) => r.niche ?? "" },
  { header: "country", get: (r) => r.country ?? "" },
  { header: "language", get: (r) => r.language ?? "" },
  { header: "subscribers", get: (r) => r.subscribers ?? "" },
  { header: "median_views_last10", get: (r) => r.median_views_last10 ?? "" },
  { header: "views_range_last10", get: (r) => r.views_range_last10 ?? "" },
  { header: "last_episode_date", get: (r) => r.last_episode_date ?? "" },
  { header: "cadence", get: (r) => r.cadence ?? "" },
  { header: "metrics_measured_on", get: (r) => r.metrics_measured_on ?? "" },
  { header: "metrics_source", get: (r) => r.metrics_source ?? "" },
  { header: "rank_in_competitor_set", get: (r) => r.rank_in_competitor_set ?? "" },
  {
    header: "top_videos",
    get: (r) => lines(r.top_videos.map((v) => `${v.title} | ${v.views ?? "not read"} views | ${v.upload_date ?? "?"} | ${v.comments ?? "?"} comments | ${v.url}`)),
  },
  {
    header: "competitors",
    get: (r) => lines(r.competitors.map((c) => `${c.name}: ${c.subscribers ?? "?"} subs, median ${c.median_views_last10 ?? "?"} | ${c.url ?? ""}`)),
  },
  { header: "primary_email", get: (r) => r.primary_email ?? "" },
  {
    header: "emails",
    get: (r) => lines(r.emails.map((e) => `${e.address} (${e.confidence}${e.role_or_owner ? `, ${e.role_or_owner}` : ""}) — ${e.source_url}`)),
  },
  {
    header: "team",
    get: (r) =>
      lines(
        [...r.team]
          .sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99))
          .map((t) => `${t.priority ?? "-"}. ${t.name}${t.title ? `, ${t.title}` : ""}${t.former_staff_flag ? " [former]" : ""}${t.linkedin_url ? ` — ${t.linkedin_url}` : ""}`),
      ),
  },
  { header: "channels", get: (r) => lines(r.channels.map((c) => `${c.platform}: ${c.url}`)) },
  { header: "not_found", get: (r) => lines(r.not_found.map((n) => `${n.what} — tried ${n.sources_tried}`)) },
  { header: "content_fit_note", get: (r) => r.content_fit_note ?? "" },
  { header: "email_subject", get: (r) => r.email_subject ?? "" },
  { header: "email_copy", get: (r) => r.email_copy },
  { header: "dm_copy", get: (r) => r.dm_copy },
  { header: "social_copy", get: (r) => r.social_copy },
  { header: "episode_referenced", get: (r) => r.episode_referenced ?? "" },
  { header: "assumes_listened", get: (r) => r.assumes_listened ?? "" },
  { header: "video_brief", get: (r) => r.video_brief ?? "" },
  { header: "canvas_url", get: (r) => r.canvas_url ?? "" },
  { header: "video_url", get: (r) => (r.video_path ? videoPublicUrl(r.video_path) : "") },
  { header: "drive_folder_url", get: (r) => r.drive_folder_url ?? "" },
  { header: "gmail_draft_id", get: (r) => r.gmail_draft_id ?? "" },
  { header: "notes", get: (r) => r.notes ?? "" },
  { header: "_sync", get: (r) => JSON.stringify(syncedValues(r)) },
];

function syncedValues(r: OutreachPodcaster): SyncedValues {
  return { stage: r.stage, decision: r.decision ?? "", notes: r.notes ?? "" };
}

function col(header: string): number {
  return LEAD_COLUMNS.findIndex((c) => c.header === header);
}

/** Sheet edits to stage / decision / notes since the last sync, as Supabase patches. */
export function editsFromSheet(rows: string[][]): Map<string, PodcasterPatch> {
  const edits = new Map<string, PodcasterPatch>();
  const [iId, iStage, iDecision, iNotes, iSync] = ["id", "stage", "decision", "notes", "_sync"].map(col);
  for (const row of rows) {
    const id = row[iId];
    if (!id) continue;
    let last: SyncedValues;
    try {
      last = JSON.parse(row[iSync] ?? "") as SyncedValues;
    } catch {
      continue; // A row without a sync stamp was typed in by hand; ignore it.
    }
    const patch: PodcasterPatch = {};
    const stage = (row[iStage] ?? "").trim();
    if (stage !== last.stage && (STAGES as readonly string[]).includes(stage)) patch.stage = stage as Stage;
    const decision = (row[iDecision] ?? "").trim();
    if (decision !== last.decision) {
      if (decision === "") patch.decision = null;
      else if ((DECISIONS as readonly string[]).includes(decision)) patch.decision = decision as Decision;
    }
    const notes = row[iNotes] ?? "";
    if (notes !== last.notes) patch.notes = notes;
    if (Object.keys(patch).length) edits.set(id, patch);
  }
  return edits;
}


export const LEAD_HEADER = LEAD_COLUMNS.map((c) => c.header);

/** The Leads tab, header row first, for the Sheets connector's update_values. */
export function leadSheetValues(rows: OutreachPodcaster[]): (string | number)[][] {
  const byId = new Map(rows.map((r) => [r.id, r]));
  return [LEAD_HEADER, ...rows.map((r) => LEAD_COLUMNS.map((c) => asText(c.get(r, byId))))];
}

/**
 * The Sheets connector writes as if typed, so a value starting with = + - or @
 * would become a formula. A leading apostrophe keeps it text and isn't read back.
 */
function asText(value: string | number): string | number {
  return typeof value === "string" && /^[=+\-@]/.test(value) ? `'${value}` : value;
}
