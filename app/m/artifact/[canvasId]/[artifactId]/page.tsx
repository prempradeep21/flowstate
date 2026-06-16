"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { ArtifactContent } from "@/components/artifacts/ArtifactContent";
import { parseCanvasSnapshot } from "@/lib/canvasSnapshot";
import { getLatestVersion, getVersionById } from "@/lib/sessionArtifacts";
import type { ArtifactPayload } from "@/lib/artifactTypes";

/**
 * Single-artifact viewer for the iOS app's WKWebView (hybrid render strategy).
 * Renders one artifact full-bleed using the same <ArtifactContent> component
 * the web app uses, so complex/interactive artifacts stay pixel-identical.
 *
 * Auth: the native app appends the Supabase access token in the URL fragment
 * (`#at=...`) — fragments never reach the server. We attach it as a Bearer
 * header so PostgREST honours the user's RLS policies.
 */
export default function MobileArtifactPage() {
  const params = useParams<{ canvasId: string; artifactId: string }>();
  const [payload, setPayload] = useState<ArtifactPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = new URLSearchParams(
      typeof window !== "undefined" ? window.location.hash.slice(1) : "",
    ).get("at");

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) {
      setError("Supabase is not configured.");
      return;
    }

    const supabase = createClient(url, anon, {
      global: token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : undefined,
      auth: { persistSession: false, autoRefreshToken: false },
    });

    (async () => {
      const { data, error: queryError } = await supabase
        .from("canvases")
        .select("state")
        .eq("id", params.canvasId)
        .maybeSingle();

      if (queryError || !data) {
        setError(queryError?.message ?? "Artifact not found.");
        return;
      }

      const snapshot = parseCanvasSnapshot(data.state);
      const artifact = snapshot?.sessionArtifacts?.[params.artifactId];
      if (!artifact) {
        setError("Artifact not found in canvas.");
        return;
      }

      const version =
        getVersionById(artifact, artifact.latestVersionId) ??
        getLatestVersion(artifact);
      if (!version) {
        setError("Artifact has no content.");
        return;
      }
      setPayload(version.payload);
    })();
  }, [params.canvasId, params.artifactId]);

  if (error) {
    return (
      <div className="flex h-screen w-screen items-center justify-center p-6 text-center text-sm text-canvas-muted">
        {error}
      </div>
    );
  }

  if (!payload) {
    return <div className="flex h-screen w-screen items-center justify-center" />;
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-white">
      <ArtifactContent payload={payload} layout="panel" />
    </div>
  );
}
