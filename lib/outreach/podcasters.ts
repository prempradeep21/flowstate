/**
 * Podcaster outreach rows — shared between the admin page, its API routes and
 * the server helpers. Each row is one podcaster and everything we send them.
 */

export const OUTREACH_MEDIA_BUCKET = "outreach-media";

interface OutreachPodcasterBase {
  id: string;
  host_name: string;
  podcast_name: string;
  podcast_url: string | null;
  canvas_url: string | null;
  video_path: string | null;
  email_copy: string;
  dm_copy: string;
  social_copy: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface OutreachPodcaster extends OutreachPodcasterBase, OutreachProspectFields {}

/**
 * Where a row is in the pipeline. The prospecting routine lands rows as `new`;
 * the morning review moves them to `queued` (assets wanted) or `skipped`; the
 * assets routine moves `queued` to `drafted`. `sent` / `replied` / `passed`
 * are set by hand after a human sends.
 */
export const STAGES = ["new", "queued", "drafted", "sent", "replied", "passed", "skipped"] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_LABELS: Record<Stage, string> = {
  new: "To review",
  queued: "Queued",
  drafted: "Drafted",
  sent: "Sent",
  replied: "Replied",
  passed: "Passed",
  skipped: "Skipped",
};

/**
 * What the morning review chose. `own_canvas` builds a canvas from one of the
 * show's episodes; `example_canvas` sends an existing canvas (another show's)
 * as the example, for lower-priority shows that get the mass send.
 */
export const DECISIONS = ["own_canvas", "example_canvas", "skip"] as const;
export type Decision = (typeof DECISIONS)[number];

export const DECISION_LABELS: Record<Decision, string> = {
  own_canvas: "Own canvas",
  example_canvas: "Example canvas",
  skip: "Skip",
};

export type Lane = "traction" | "emerging";
export type TractionTier = "very high" | "high" | "mid" | "micro";

export interface TopVideo {
  title: string;
  url: string;
  views: number | null;
  upload_date: string | null;
  comments: number | null;
}

export interface Competitor {
  name: string;
  url: string | null;
  subscribers: number | null;
  median_views_last10: number | null;
  size_note: string | null;
  measured_on: string | null;
}

export interface VerifiedEmail {
  address: string;
  source_url: string;
  confidence: "high" | "medium";
  role_or_owner: string | null;
}

export interface TeamMember {
  name: string;
  title: string | null;
  linkedin_url: string | null;
  x_url: string | null;
  fit_for_pitch: string | null;
  /** 1 = pitch first. */
  priority: number | null;
  former_staff_flag: boolean;
}

export interface SocialChannel {
  platform: string;
  url: string;
  source_url: string | null;
}

export interface NotFound {
  what: string;
  sources_tried: string;
}

/**
 * Everything the prospecting routine fills in. All optional for hand-added rows.
 * A type alias, not an interface: the Supabase table types need an implicit
 * index signature, which interfaces don't get.
 */
export type OutreachProspectFields = {
  podcast_key: string | null;
  source: "manual" | "prospecting";
  run_id: string | null;
  added_on: string | null;
  stage: Stage;
  decision: Decision | null;
  example_canvas_from: string | null;
  reviewed_at: string | null;
  lane: Lane | null;
  domain: string | null;
  niche: string | null;
  country: string | null;
  language: string | null;
  content_fit_note: string | null;
  traction_tier: TractionTier | null;
  subscribers: number | null;
  median_views_last10: number | null;
  views_range_last10: string | null;
  last_episode_date: string | null;
  cadence: string | null;
  metrics_measured_on: string | null;
  metrics_source: string | null;
  rank_in_competitor_set: string | null;
  top_videos: TopVideo[];
  competitors: Competitor[];
  emails: VerifiedEmail[];
  team: TeamMember[];
  channels: SocialChannel[];
  not_found: NotFound[];
  primary_email: string | null;
  email_subject: string | null;
  episode_referenced: string | null;
  assumes_listened: string | null;
  video_brief: string | null;
  drive_folder_url: string | null;
  gmail_draft_id: string | null;
  notes: string | null;
};

export type CopyKey = "email_copy" | "dm_copy" | "social_copy";

export const COPY_KINDS: { key: CopyKey; label: string; short: string }[] = [
  { key: "email_copy", label: "Email", short: "Email" },
  { key: "dm_copy", label: "Instagram / X / LinkedIn DM", short: "DM" },
  { key: "social_copy", label: "Flowstate social post", short: "Flowstate social" },
];

/** Fields an admin may set through POST/PATCH. Everything else is server-owned. */
export const EDITABLE_FIELDS = [
  "host_name",
  "podcast_name",
  "podcast_url",
  "canvas_url",
  "video_path",
  "email_copy",
  "dm_copy",
  "social_copy",
  "sort_order",
  "stage",
  "decision",
  "example_canvas_from",
  "primary_email",
  "email_subject",
  "notes",
] as const;

export type EditableField = (typeof EDITABLE_FIELDS)[number];
export type PodcasterPatch = Partial<Pick<OutreachPodcaster, EditableField>>;

/** Keep only whitelisted fields with the right type; drop anything else. */
export function pickPatch(input: unknown): PodcasterPatch {
  if (!input || typeof input !== "object") return {};
  const src = input as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const field of EDITABLE_FIELDS) {
    if (!(field in src)) continue;
    const value = src[field];
    if (field === "sort_order") {
      if (typeof value === "number" && Number.isFinite(value)) out[field] = value;
    } else if (field === "stage") {
      if ((STAGES as readonly unknown[]).includes(value)) out[field] = value;
    } else if (field === "decision") {
      if (value === null || (DECISIONS as readonly unknown[]).includes(value)) out[field] = value;
    } else if (typeof value === "string") {
      out[field] = value;
    } else if (value === null && !isRequiredText(field)) {
      out[field] = null;
    }
  }
  return out as PodcasterPatch;
}

function isRequiredText(field: EditableField): boolean {
  return (
    field === "host_name" ||
    field === "podcast_name" ||
    field === "email_copy" ||
    field === "dm_copy" ||
    field === "social_copy"
  );
}

/** "1.2M", "48K", "930" — for table cells; null reads as an em dash. */
export function compactCount(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

export function videoPublicUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  return `${base}/storage/v1/object/public/${OUTREACH_MEDIA_BUCKET}/${encoded}`;
}
