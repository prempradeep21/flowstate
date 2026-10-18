import { createClient } from "@/lib/supabase/client";
import {
  OUTREACH_MEDIA_BUCKET,
  type OutreachPodcaster,
  type PodcasterPatch,
} from "@/lib/outreach/podcasters";

async function call<T>(url: string, init: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
  });
  const body = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(body.error ?? `Request failed (${res.status})`);
  return body;
}

export async function createPodcaster(patch: PodcasterPatch): Promise<OutreachPodcaster> {
  const { podcaster } = await call<{ podcaster: OutreachPodcaster }>("/api/admin/outreach", {
    method: "POST",
    body: JSON.stringify(patch),
  });
  return podcaster;
}

export async function patchPodcaster(
  id: string,
  patch: PodcasterPatch,
): Promise<OutreachPodcaster> {
  const { podcaster } = await call<{ podcaster: OutreachPodcaster }>(
    `/api/admin/outreach/${id}`,
    { method: "PATCH", body: JSON.stringify(patch) },
  );
  return podcaster;
}

export async function deletePodcaster(id: string): Promise<void> {
  await call(`/api/admin/outreach/${id}`, { method: "DELETE" });
}

/** Signed direct-to-Storage upload; returns the object path to store on the row. */
export async function uploadShowcaseVideo(file: File): Promise<string> {
  const { path, token } = await call<{ path: string; token: string }>(
    "/api/admin/outreach/video-upload",
    { method: "POST", body: JSON.stringify({ contentType: file.type }) },
  );
  const { error } = await createClient()
    .storage.from(OUTREACH_MEDIA_BUCKET)
    .uploadToSignedUrl(path, token, file, { contentType: file.type });
  if (error) throw new Error(error.message);
  return path;
}
