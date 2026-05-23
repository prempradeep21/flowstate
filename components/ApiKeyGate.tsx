"use client";

import { useState, KeyboardEvent } from "react";
import { useApiKey } from "@/lib/useApiKey";

export function ApiKeyGate({ children }: { children: React.ReactNode }) {
  const { apiKey, setApiKey, ready } = useApiKey();
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState<"idle" | "validating" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const validate = async () => {
    const key = draft.trim();
    if (!key) return;
    setStatus("validating");
    setErrorMsg("");
    try {
      const res = await fetch("/api/validate", {
        method: "POST",
        headers: { "x-api-key": key },
      });
      const data = await res.json();
      if (data.valid) {
        setApiKey(key);
      } else {
        setErrorMsg(data.error ?? "Invalid API key");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Could not reach server. Try again.");
      setStatus("error");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") validate();
  };

  // Wait until sessionStorage is read to avoid flash
  if (!ready) return null;

  // Key present — render the app normally
  if (apiKey) return <>{children}</>;

  // No key — show the gate
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-canvas-bg">
      {/* Dot grid background matching the canvas */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, var(--dot-color) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />

      <div className="relative w-full max-w-sm rounded-2xl border border-canvas-border bg-canvas-card px-8 py-10 shadow-cardHover">
        {/* Logo / title */}
        <div className="mb-8 text-center">
          <div className="mb-2 text-[13px] font-medium uppercase tracking-widest text-canvas-muted">
            Flowstate
          </div>
          <h1 className="text-[22px] font-bold text-canvas-ink">
            Enter your API key
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-canvas-muted">
            Your Anthropic API key is used directly from your browser and never
            stored on any server.
          </p>
        </div>

        {/* Input */}
        <div className="mb-3">
          <input
            type="password"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              if (status === "error") setStatus("idle");
            }}
            onKeyDown={handleKeyDown}
            placeholder="sk-ant-..."
            autoFocus
            className="w-full rounded-xl border border-canvas-border bg-canvas-bg px-4 py-3 font-mono text-[13px] text-canvas-ink outline-none placeholder:text-canvas-muted/60 focus:border-canvas-ink/40 focus:ring-2 focus:ring-canvas-ink/10 transition-all"
          />
        </div>

        {/* Error message */}
        {status === "error" && (
          <p className="mb-3 text-[12px] text-red-500">{errorMsg}</p>
        )}

        {/* Submit button */}
        <button
          type="button"
          onClick={validate}
          disabled={status === "validating" || !draft.trim()}
          className="w-full rounded-xl bg-canvas-ink py-3 text-[14px] font-semibold text-canvas-card transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {status === "validating" ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-canvas-card/30 border-t-canvas-card" />
              Validating…
            </span>
          ) : (
            "Start"
          )}
        </button>

        {/* Get a key link */}
        <p className="mt-5 text-center text-[12px] text-canvas-muted">
          Don&apos;t have a key?{" "}
          <a
            href="https://console.anthropic.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-canvas-ink"
          >
            Get one from Anthropic
          </a>
        </p>
      </div>
    </div>
  );
}
