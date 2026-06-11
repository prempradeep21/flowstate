"use client";

import { useEffect, useState } from "react";
import {
  GOOGLE_OAUTH_MESSAGE_TYPE,
  type GoogleOAuthCompleteMessage,
} from "@/lib/google/oauthMessages";
import { parseOAuthIntent } from "@/lib/google/oauthReturn";

export default function GoogleOAuthCompletePage() {
  const [message, setMessage] = useState("Finishing Google Drive connection…");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const returnTo = params.get("returnTo") || "/";
    const payload: GoogleOAuthCompleteMessage = {
      type: GOOGLE_OAUTH_MESSAGE_TYPE,
      connected: params.get("google_connected") === "1",
      error: params.get("google_error") ?? undefined,
      intent: parseOAuthIntent(params.get("google_intent")),
      artifactId: params.get("google_artifact_id") ?? undefined,
    };

    if (window.opener) {
      try {
        window.opener.postMessage(payload, window.location.origin);
        setMessage("Connected. Closing this window…");
        window.setTimeout(() => window.close(), 400);
        return;
      } catch {
        // COOP may block opener access; fall through to same-tab redirect.
      }
    }

    setMessage("Returning to Flowstate…");
    const dest = new URL(returnTo, window.location.origin);
    if (payload.connected) {
      dest.searchParams.set("google_connected", "1");
      if (payload.intent === "picker") {
        dest.searchParams.set("google_intent", "picker");
      }
      if (payload.artifactId) {
        dest.searchParams.set("google_artifact_id", payload.artifactId);
      }
    } else if (payload.error) {
      dest.searchParams.set("google_error", payload.error);
    }
    window.location.replace(dest.toString());
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas-bg px-6">
      <p className="max-w-md text-center text-canvas-body text-canvas-ink">
        {message}
      </p>
    </main>
  );
}
