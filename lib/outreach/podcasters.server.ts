import { createServiceRoleClient } from "@/lib/supabase/serviceRole";
import type { Decision, OutreachPodcaster, PodcasterPatch } from "@/lib/outreach/podcasters";

/** Any stored field. The API narrows input with pickPatch; scripts and routines may set the rest. */
export type PodcasterFields = Partial<Omit<OutreachPodcaster, "id" | "created_at" | "updated_at">>;

const TABLE = "outreach_podcasters";

export async function listPodcasters(): Promise<OutreachPodcaster[]> {
  const { data, error } = await createServiceRoleClient()
    .from(TABLE)
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createPodcaster(
  patch: PodcasterPatch & { host_name: string; podcast_name: string },
): Promise<OutreachPodcaster> {
  const { data, error } = await createServiceRoleClient()
    .from(TABLE)
    .insert(patch)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updatePodcaster(
  id: string,
  patch: PodcasterPatch | PodcasterFields,
): Promise<OutreachPodcaster | null> {
  const { data, error } = await createServiceRoleClient()
    .from(TABLE)
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function deletePodcaster(id: string): Promise<void> {
  const { error } = await createServiceRoleClient().from(TABLE).delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function getPodcaster(id: string): Promise<OutreachPodcaster | null> {
  const { data, error } = await createServiceRoleClient().from(TABLE).select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Add prospected shows, add-only: a row whose podcast_key already exists is
 * left exactly as it is (the user may have edited it), and reported back.
 */
export async function insertProspects(
  rows: (PodcasterFields & { host_name: string; podcast_name: string; podcast_key: string })[],
): Promise<{ inserted: OutreachPodcaster[]; skipped: string[] }> {
  const supabase = createServiceRoleClient();
  const keys = rows.map((r) => r.podcast_key);
  const { data: existing, error } = await supabase.from(TABLE).select("podcast_key").in("podcast_key", keys);
  if (error) throw new Error(error.message);
  const taken = new Set((existing ?? []).map((r) => r.podcast_key));
  const fresh = rows.filter((r) => !taken.has(r.podcast_key));
  if (!fresh.length) return { inserted: [], skipped: keys };
  const { data, error: insertError } = await supabase
    .from(TABLE)
    .insert(fresh.map((r) => ({ ...r, source: "prospecting" as const, stage: "new" as const })))
    .select("*");
  if (insertError) throw new Error(insertError.message);
  return { inserted: data ?? [], skipped: keys.filter((k) => taken.has(k)) };
}

/**
 * Record the morning review. Own and example canvases are queued for the
 * assets routine; skips are parked. Only rows still awaiting assets can be
 * re-decided, so a drafted row is never pulled back by a stale click.
 */
export async function applyDecisions(
  decisions: { id: string; decision: Decision; example_canvas_from: string | null }[],
): Promise<OutreachPodcaster[]> {
  const supabase = createServiceRoleClient();
  const now = new Date().toISOString();
  const updated: OutreachPodcaster[] = [];
  for (const d of decisions) {
    const { data, error } = await supabase
      .from(TABLE)
      .update({
        decision: d.decision,
        example_canvas_from: d.decision === "example_canvas" ? d.example_canvas_from : null,
        stage: d.decision === "skip" ? "skipped" : "queued",
        reviewed_at: now,
        updated_at: now,
      })
      .eq("id", d.id)
      .in("stage", ["new", "queued", "skipped"])
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (data) updated.push(data);
  }
  return updated;
}
