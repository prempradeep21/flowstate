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
  const [state, setState] = useState<GoogleConnectionState>({
    signedIn: false,
    connected: false,
    loading: true,
  });

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const res = await fetch("/api/google/status");
      const data = (await res.json()) as {
        signedIn?: boolean;
        connected?: boolean;
        email?: string;
      };
      setState({
        signedIn: Boolean(data.signedIn),
        connected: Boolean(data.connected),
        email: data.email,
        loading: false,
      });
    } catch {
      setState({
        signedIn: false,
        connected: false,
        loading: false,
      });
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

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
