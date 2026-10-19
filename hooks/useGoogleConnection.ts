"use client";

import { useCallback, useEffect, useState } from "react";
import {
  buildConnectUrl,
  GOOGLE_OAUTH_POPUP_NAME,
  type GoogleOAuthIntent,
} from "@/lib/google/oauthReturn";
import {
  requestOAuthFlush,
  saveOAuthResumeCheckpoint,
} from "@/lib/google/oauthResume";

export interface GoogleConnectionState {
  signedIn: boolean;
  connected: boolean;
  email?: string;
  loading: boolean;
}

export interface GoogleConnectOptions {
  intent?: GoogleOAuthIntent;
  artifactId?: string;
}

type GoogleStatus = Omit<GoogleConnectionState, "loading">;

/**
 * One shared status for every hook instance. Each card composer and artifact
 * menu mounts this hook, and each used to fire its own /api/google/status —
 * ~80 requests per canvas load (each ~500ms of middleware auth), and more
 * whenever panning mounted nodes. Mounts now share one in-flight request and
 * a short-lived cache; refresh() refetches and updates every subscriber.
 */
const STATUS_TTL_MS = 30_000;
let cachedStatus: { value: GoogleStatus; at: number } | null = null;
let inflightStatus: Promise<GoogleStatus> | null = null;
const statusListeners = new Set<(s: GoogleStatus) => void>();

function freshCachedStatus(): GoogleStatus | null {
  return cachedStatus && Date.now() - cachedStatus.at < STATUS_TTL_MS
    ? cachedStatus.value
    : null;
}

function loadGoogleStatus(force: boolean): Promise<GoogleStatus> {
  if (!force) {
    const cached = freshCachedStatus();
    if (cached) return Promise.resolve(cached);
    if (inflightStatus) return inflightStatus;
  }
  const request: Promise<GoogleStatus> = fetch("/api/google/status")
    .then(async (res) => {
      const data = (await res.json()) as {
        signedIn?: boolean;
        connected?: boolean;
        email?: string;
      };
      const value: GoogleStatus = {
        signedIn: Boolean(data.signedIn),
        connected: Boolean(data.connected),
        email: data.email,
      };
      cachedStatus = { value, at: Date.now() };
      return value;
    })
    // Failures are reported but not cached — the next mount retries.
    .catch(() => ({ signedIn: false, connected: false }))
    .then((value) => {
      if (inflightStatus === request) inflightStatus = null;
      for (const listener of statusListeners) listener(value);
      return value;
    });
  inflightStatus = request;
  return request;
}

function openOAuthPopup(url: string): Window | null {
  return window.open(
    url,
    GOOGLE_OAUTH_POPUP_NAME,
    "popup=yes,width=520,height=720,noopener=no",
  );
}

export function useGoogleConnection(): GoogleConnectionState & {
  refresh: () => Promise<void>;
  connect: (opts?: GoogleConnectOptions) => void;
  disconnect: () => Promise<void>;
} {
  const [state, setState] = useState<GoogleConnectionState>(() => {
    const cached = freshCachedStatus();
    return cached
      ? { ...cached, loading: false }
      : { signedIn: false, connected: false, loading: true };
  });

  useEffect(() => {
    const listener = (value: GoogleStatus) =>
      setState({ ...value, loading: false });
    statusListeners.add(listener);
    void loadGoogleStatus(false).then(listener);
    return () => {
      statusListeners.delete(listener);
    };
  }, []);

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));
    await loadGoogleStatus(true);
  }, []);

  const connect = useCallback((opts?: GoogleConnectOptions) => {
    void (async () => {
      saveOAuthResumeCheckpoint(opts);
      try {
        await requestOAuthFlush();
      } catch {
        // Session checkpoint still protects same-tab fallback.
      }

      const url = buildConnectUrl(opts);
      const popup = openOAuthPopup(url);

      if (popup) {
        window.dispatchEvent(new CustomEvent("flowstate:google-oauth-waiting"));
        // Do not poll popup.closed — COOP blocks it after Google redirects.
        window.setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent("flowstate:google-oauth-waiting-done"),
          );
        }, 120_000);
        return;
      }

      window.location.href = url;
    })();
  }, []);

  const disconnect = useCallback(async () => {
    await fetch("/api/google/disconnect", { method: "POST" });
    await refresh();
  }, [refresh]);

  return { ...state, refresh, connect, disconnect };
}
