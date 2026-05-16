"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "flowstate_api_key";

export function useApiKey() {
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setApiKeyState(sessionStorage.getItem(STORAGE_KEY));
    setReady(true);
  }, []);

  const setApiKey = (key: string) => {
    sessionStorage.setItem(STORAGE_KEY, key);
    setApiKeyState(key);
  };

  const clearApiKey = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setApiKeyState(null);
  };

  return { apiKey, setApiKey, clearApiKey, ready };
}

export function getStoredApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(STORAGE_KEY);
}
