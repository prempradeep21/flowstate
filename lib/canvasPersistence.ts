import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildCanvasSnapshot,
  buildEmptyCanvasSnapshot,
  type CanvasSnapshot,
  parseCanvasSnapshot,
} from "@/lib/canvasSnapshot";
import type { Database } from "@/lib/supabase/database.types";
import type { CanvasSnapshotSource } from "@/lib/canvasSnapshot";

export interface CanvasRow {
  id: string;
  state: CanvasSnapshot;
}

export interface CanvasMeta {
  id: string;
  title: string;
  isDefault: boolean;
  updatedAt: string;
}

export interface UserPreferences {
  lastActiveCanvasId?: string;
}

type Supabase = SupabaseClient<Database>;

function parsePreferences(raw: unknown): UserPreferences {
  if (!raw || typeof raw !== "object") return {};
  const prefs = raw as Record<string, unknown>;
  const lastActiveCanvasId = prefs.lastActiveCanvasId;
  return {
    lastActiveCanvasId:
      typeof lastActiveCanvasId === "string" ? lastActiveCanvasId : undefined,
  };
}

export async function fetchUserPreferences(
  supabase: Supabase,
  userId: string,
): Promise<UserPreferences> {
  const { data, error } = await supabase
    .from("profiles")
    .select("preferences")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return parsePreferences(data?.preferences);
}

export async function updateLastActiveCanvas(
  supabase: Supabase,
  userId: string,
  canvasId: string,
): Promise<void> {
  const existing = await fetchUserPreferences(supabase, userId);
  const { error } = await supabase
    .from("profiles")
    .update({
      preferences: {
        ...existing,
        lastActiveCanvasId: canvasId,
      } as Database["public"]["Tables"]["profiles"]["Update"]["preferences"],
    })
    .eq("id", userId);

  if (error) throw error;
}

export async function fetchCanvasList(
  supabase: Supabase,
  userId: string,
): Promise<CanvasMeta[]> {
  const { data, error } = await supabase
    .from("canvases")
    .select("id, title, is_default, updated_at")
    .eq("owner_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    isDefault: row.is_default,
    updatedAt: row.updated_at,
  }));
}

export async function fetchCanvasById(
  supabase: Supabase,
  canvasId: string,
): Promise<CanvasRow | null> {
  const { data, error } = await supabase
    .from("canvases")
    .select("id, state")
    .eq("id", canvasId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const snapshot = parseCanvasSnapshot(data.state);
  if (!snapshot) return null;

  return { id: data.id, state: snapshot };
}

export async function fetchDefaultCanvas(
  supabase: Supabase,
  userId: string,
): Promise<CanvasRow | null> {
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

export function resolveInitialCanvasId(
  canvases: CanvasMeta[],
  preferences: UserPreferences,
): string | null {
  if (canvases.length === 0) return null;

  const lastActive = preferences.lastActiveCanvasId;
  if (lastActive && canvases.some((c) => c.id === lastActive)) {
    return lastActive;
  }

  const defaultCanvas = canvases.find((c) => c.isDefault);
  if (defaultCanvas) return defaultCanvas.id;

  return canvases[0]?.id ?? null;
}

export function generateUntitledCanvasTitle(existingTitles: string[]): string {
  const base = "Untitled canvas";
  if (!existingTitles.includes(base)) return base;

  let n = 2;
  while (existingTitles.includes(`${base} ${n}`)) {
    n += 1;
  }
  return `${base} ${n}`;
}

export async function createDefaultCanvas(
  supabase: Supabase,
  userId: string,
  source: CanvasSnapshotSource,
): Promise<CanvasRow> {
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

export async function createCanvas(
  supabase: Supabase,
  userId: string,
  title: string,
  source?: CanvasSnapshotSource,
): Promise<CanvasRow> {
  const snapshot = source
    ? buildCanvasSnapshot(source)
    : buildEmptyCanvasSnapshot();

  const { data, error } = await supabase
    .from("canvases")
    .insert({
      owner_id: userId,
      title,
      state: snapshot as unknown as Database["public"]["Tables"]["canvases"]["Insert"]["state"],
      is_default: false,
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
