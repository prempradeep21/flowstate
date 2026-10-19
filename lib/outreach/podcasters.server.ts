import { createServiceRoleClient } from "@/lib/supabase/serviceRole";
import type { OutreachPodcaster, PodcasterPatch } from "@/lib/outreach/podcasters";

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
  patch: PodcasterPatch,
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
