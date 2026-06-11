"use client";

import { useCallback, useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    gapi?: {
      load: (name: string, opts: { callback: () => void }) => void;
    };
    google?: {
      picker: {
        Action: { PICKED: string; CANCEL: string };
        DocsView: new (viewId?: string) => {
          setIncludeFolders: (include: boolean) => unknown;
          setSelectFolderEnabled: (enabled: boolean) => unknown;
        };
        ViewId: { DOCS: string; SPREADSHEETS: string; PRESENTATIONS: string; DOCS_IMAGES: string };
        PickerBuilder: new () => {
          addView: (view: unknown) => PickerBuilderInstance;
          setOAuthToken: (token: string) => PickerBuilderInstance;
          setDeveloperKey: (key: string) => PickerBuilderInstance;
          setAppId: (appId: string) => PickerBuilderInstance;
          setCallback: (cb: (data: GooglePickerResponse) => void) => PickerBuilderInstance;
          build: () => { setVisible: (visible: boolean) => void };
        };
      };
    };
  }

  interface PickerBuilderInstance {
    addView: (view: unknown) => PickerBuilderInstance;
    setOAuthToken: (token: string) => PickerBuilderInstance;
    setDeveloperKey: (key: string) => PickerBuilderInstance;
    setAppId: (appId: string) => PickerBuilderInstance;
    setCallback: (cb: (data: GooglePickerResponse) => void) => PickerBuilderInstance;
    build: () => { setVisible: (visible: boolean) => void };
  }
}

interface GooglePickerResponse {
  action: string;
  docs?: Array<{
    id: string;
    name: string;
    mimeType: string;
    url?: string;
  }>;
}

interface PickerCredentials {
  accessToken: string;
  clientId: string;
  pickerApiKey: string;
}

let pickerScriptPromise: Promise<void> | null = null;

function loadPickerScript(): Promise<void> {
  if (pickerScriptPromise) return pickerScriptPromise;
  pickerScriptPromise = new Promise((resolve, reject) => {
    if (window.gapi?.load && window.google?.picker) {
      resolve();
      return;
    }
    const existing = document.getElementById("google-picker-script");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Picker script failed")));
      return;
    }
    const script = document.createElement("script");
    script.id = "google-picker-script";
    script.src = "https://apis.google.com/js/api.js";
    script.async = true;
    script.onload = () => {
      window.gapi?.load("picker", { callback: () => resolve() });
    };
    script.onerror = () => reject(new Error("Picker script failed"));
    document.head.appendChild(script);
  });
  return pickerScriptPromise;
}

async function fetchPickerCredentials(): Promise<PickerCredentials> {
  const res = await fetch("/api/google/access-token");
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Could not authorize Google Picker");
  }
  return (await res.json()) as PickerCredentials;
}

export function useGooglePicker() {
  const [busy, setBusy] = useState(false);
  const openingRef = useRef(false);

  useEffect(() => {
    void loadPickerScript().catch(() => {
      /* picker unavailable until connect */
    });
  }, []);

  const openPicker = useCallback(
    async (onPick: (doc: { id: string; name: string; mimeType: string; url?: string }) => void) => {
      if (openingRef.current) return;
      openingRef.current = true;
      setBusy(true);
      try {
        await loadPickerScript();
        const creds = await fetchPickerCredentials();
        const picker = window.google?.picker;
        const gapi = window.gapi;
        if (!picker || !gapi) {
          throw new Error("Google Picker is unavailable");
        }

        const docsView = new picker.DocsView(picker.ViewId.DOCS);
        docsView.setIncludeFolders(false);
        docsView.setSelectFolderEnabled(false);

        const sheetsView = new picker.DocsView(picker.ViewId.SPREADSHEETS);
        sheetsView.setIncludeFolders(false);

        const slidesView = new picker.DocsView(picker.ViewId.PRESENTATIONS);
        slidesView.setIncludeFolders(false);

        const appId = creds.clientId.split("-")[0] ?? creds.clientId;

        await new Promise<void>((resolve, reject) => {
          try {
            const builder = new picker.PickerBuilder()
              .addView(docsView)
              .addView(sheetsView)
              .addView(slidesView)
              .setOAuthToken(creds.accessToken)
              .setDeveloperKey(creds.pickerApiKey)
              .setAppId(appId)
              .setCallback((data: GooglePickerResponse) => {
                if (data.action === picker.Action.PICKED && data.docs?.[0]) {
                  onPick(data.docs[0]);
                }
                resolve();
              });
            builder.build().setVisible(true);
          } catch (err) {
            reject(err);
          }
        });
      } finally {
        openingRef.current = false;
        setBusy(false);
      }
    },
    [],
  );

  return { openPicker, busy };
}
