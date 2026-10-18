/**
 * Podcaster outreach rows — shared between the admin page, its API routes and
 * the server helpers. Each row is one podcaster and everything we send them.
 */

export const OUTREACH_MEDIA_BUCKET = "outreach-media";

export interface OutreachPodcaster {
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

export function videoPublicUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  return `${base}/storage/v1/object/public/${OUTREACH_MEDIA_BUCKET}/${encoded}`;
}
