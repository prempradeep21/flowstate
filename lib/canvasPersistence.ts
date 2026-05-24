import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildCanvasSnapshot,
  type CanvasSnapshot,
  parseCanvasSnapshot,
} from "@/lib/canvasSnapshot";
import type { Database } from "@/lib/supabase/database.types";
import type { CanvasSnapshotSource } from "@/lib/canvasSnapshot";

export interface DefaultCanvasRow {
  id: string;
  state: CanvasSnapshot;
}

type Supabase = SupabaseClient<Database>;

export async function fetchDefaultCanvas(
  supabase: Supabase,
  userId: string,
): Promise<DefaultCanvasRow | null> {
  const { data, error } = await supabase
    .from("canvases")
    .select("id, state")
    .eq("owner_id", userId)
    .eq("is_default", true)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const snapshot = parseCanvasSnapshot(data.state);
  if (!snapshot) return null;

  return { id: data.id, state: snapshot };
}

export async function createDefaultCanvas(
  supabase: Supabase,
  userId: string,
  source: CanvasSnapshotSource,
): Promise<DefaultCanvasRow> {
  const snapshot = buildCanvasSnapshot(source);

  const { data, error } = await supabase
    .from("canvases")
    .insert({
      owner_id: userId,
      title: "My canvas",
      state: snapshot as unknown as Database["public"]["Tables"]["canvases"]["Insert"]["state"],
      is_default: true,
    })
    .select("id, state")
    .single();

  if (error) throw error;

  const parsed = parseCanvasSnapshot(data.state) ?? snapshot;
  return { id: data.id, state: parsed };
}

export async function saveCanvasState(
  supabase: Supabase,
  canvasId: string,
  source: CanvasSnapshotSource,
): Promise<void> {
  const snapshot = buildCanvasSnapshot(source);

  const { error } = await supabase
    .from("canvases")
    .update({
      state: snapshot as unknown as Database["public"]["Tables"]["canvases"]["Update"]["state"],
      version: 1,
    })
    .eq("id", canvasId);

  if (error) throw error;
}
