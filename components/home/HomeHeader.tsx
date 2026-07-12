"use client";

import { FlowstateBrand } from "@/components/FlowstateBrand";
import { useAuth } from "@/components/AuthProvider";
import type { HomeTheme } from "@/components/home/useHomeTheme";

export function HomeHeader({
  theme,
  onToggleTheme,
}: {
  theme: HomeTheme;
  onToggleTheme: () => void;
}) {
  const { user, supabaseConfigured, signInWithGoogle, signOut } = useAuth();

  const name =
    (user?.user_metadata?.full_name as string | undefined) ??
    (user?.user_metadata?.name as string | undefined) ??
    user?.email ??
    "You";
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;

  return (
    <header className="sticky top-0 z-20 border-b border-canvas-border bg-canvas-card shadow-card">
      <div className="mx-auto flex w-full max-w-[86rem] items-center justify-between gap-4 px-6 py-3 sm:px-8">
        <FlowstateBrand />

        <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-canvas border border-canvas-border bg-canvas-card text-canvas-muted shadow-card transition-colors hover:bg-canvas-bg hover:text-canvas-ink"
        >
          <span
            className={`absolute transition-all duration-motion-standard ease-motion-settle motion-reduce:transition-none ${
              theme === "dark"
                ? "translate-y-0 rotate-0 opacity-100"
                : "translate-y-6 -rotate-90 opacity-0"
            }`}
          >
            <MoonIcon />
          </span>
          <span
            className={`absolute transition-all duration-motion-standard ease-motion-settle motion-reduce:transition-none ${
              theme === "dark"
                ? "-translate-y-6 rotate-90 opacity-0"
                : "translate-y-0 rotate-0 opacity-100"
            }`}
          >
            <SunIcon />
          </span>
        </button>

        {supabaseConfigured &&
          (user ? (
            <>
              <div className="flex items-center gap-2">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={name}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-canvas-accent text-canvas-compact font-semibold text-canvas-onAccent">
                    {name.charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="hidden max-w-[12rem] truncate text-canvas-body-sm text-canvas-ink sm:inline">
                  {name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => void signOut()}
                className="rounded-canvas border border-canvas-border px-3 py-1.5 text-canvas-body-sm text-canvas-muted transition-colors hover:bg-canvas-card hover:text-canvas-ink"
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => void signInWithGoogle()}
              className="rounded-canvas bg-canvas-ink px-3 py-1.5 text-canvas-body-sm font-medium text-canvas-card transition-opacity hover:opacity-90"
            >
              Sign in
            </button>
            ))}
        </div>
      </div>
    </header>
  );
}

function SunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
    >
      <circle cx="12" cy="12" r="4" />
      <path
        d="M12 2.5v2M12 19.5v2M21.5 12h-2M4.5 12h-2M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4M18.7 18.7l-1.4-1.4M6.7 6.7 5.3 5.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
    >
      <path
        d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
