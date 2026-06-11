"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth, usePersistenceReady } from "@/components/AuthProvider";
import { useGoogleConnection } from "@/hooks/useGoogleConnection";
import { useGooglePicker } from "@/hooks/useGooglePicker";
import {
  friendlyGoogleOAuthError,
  isGoogleOAuthCompleteMessage,
} from "@/lib/google/oauthMessages";
import {
  messageToResumeInput,
  runGoogleOAuthResume,
} from "@/lib/google/runGoogleOAuthResume";

function readUrlResume() {
  const params = new URLSearchParams(window.location.search);
  return {
    connected: params.get("google_connected") === "1",
    error: params.get("google_error") ?? undefined,
    intent:
      params.get("google_intent") === "picker"
        ? ("picker" as const)
        : ("none" as const),
    artifactId: params.get("google_artifact_id") ?? undefined,
  };
}

function cleanOAuthSearchParams(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete("google_connected");
  url.searchParams.delete("google_intent");
  url.searchParams.delete("google_artifact_id");
  url.searchParams.delete("google_error");
  window.history.replaceState({}, "", url.toString());
}

/** Resumes Google Drive OAuth after popup or same-tab redirect. */
export function GoogleOAuthReturnBridge() {
  const persistenceReady = usePersistenceReady();
  const { authLoading, user } = useAuth();
  const { refresh } = useGoogleConnection();
  const { openPicker } = useGooglePicker();
  const urlHandledRef = useRef(false);
  const [status, setStatus] = useState<string | null>(null);
  const [waitingForPopup, setWaitingForPopup] = useState(false);

  const resumeOAuth = useCallback(
    async (input: Parameters<typeof runGoogleOAuthResume>[0]) => {
      if (authLoading || !persistenceReady) return;
      if (!user) {
        setStatus("Sign in to Flowstate to finish connecting Google Drive.");
        return;
      }

      setWaitingForPopup(false);

      if (input.error) {
        setStatus(friendlyGoogleOAuthError(input.error));
        window.setTimeout(() => setStatus(null), 12_000);
        return;
      }

      setStatus("Opening Google Drive file picker…");
      try {
        const errorMessage = await runGoogleOAuthResume(input, {
          refresh,
          openPicker,
        });
        if (errorMessage) {
          setStatus(errorMessage);
          window.setTimeout(() => setStatus(null), 12_000);
          return;
        }
        setStatus(null);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Could not open Google Picker";
        setStatus(
          `${message}. Use “Choose in Google Drive” on the artifact or composer.`,
        );
        window.setTimeout(() => setStatus(null), 12_000);
      }
    },
    [authLoading, openPicker, persistenceReady, refresh, user],
  );

  useEffect(() => {
    const onWaiting = () => {
      setWaitingForPopup(true);
      setStatus("Finish Google sign-in in the popup window…");
    };
    const onWaitingDone = () => {
      setWaitingForPopup(false);
      if (!status?.includes("Finish Google")) {
        return;
      }
      setStatus(null);
    };

    window.addEventListener("flowstate:google-oauth-waiting", onWaiting);
    window.addEventListener("flowstate:google-oauth-waiting-done", onWaitingDone);
    return () => {
      window.removeEventListener("flowstate:google-oauth-waiting", onWaiting);
      window.removeEventListener(
        "flowstate:google-oauth-waiting-done",
        onWaitingDone,
      );
    };
  }, [status]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (!isGoogleOAuthCompleteMessage(event.data)) return;
      window.dispatchEvent(
        new CustomEvent("flowstate:google-oauth-waiting-done"),
      );
      void resumeOAuth(messageToResumeInput(event.data));
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [resumeOAuth]);

  useEffect(() => {
    if (urlHandledRef.current || typeof window === "undefined") return;

    const url = readUrlResume();
    if (!url.connected && !url.error) return;
    if (authLoading || !persistenceReady) return;

    urlHandledRef.current = true;
    cleanOAuthSearchParams();
    void resumeOAuth({
      ...url,
      restoreCheckpoint: true,
    });
  }, [authLoading, persistenceReady, resumeOAuth]);

  const displayStatus =
    status ??
    (waitingForPopup ? "Finish Google sign-in in the popup window…" : null);

  if (!displayStatus) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[60000] flex justify-center px-4">
      <p className="max-w-lg rounded-canvas border border-canvas-border bg-canvas-card px-4 py-2 text-center text-canvas-body-sm text-canvas-ink shadow-card">
        {displayStatus}
      </p>
    </div>
  );
}
