"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";

export function AuthButton() {
  const {
    user,
    authLoading,
    supabaseConfigured,
    signInWithGoogle,
    signOut,
  } = useAuth();
  const [busy, setBusy] = useState(false);

  if (!supabaseConfigured) {
    return (
      <div
        className="pointer-events-auto rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200/90"
        title="Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local"
      >
        Sign-in needs Supabase keys in .env.local
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="pointer-events-auto rounded-full border border-canvas-border/60 bg-canvas-surface/90 px-3 py-1.5 text-xs text-canvas-muted">
        Loading…
      </div>
    );
  }

  if (user) {
    const name =
      user.user_metadata?.full_name ??
      user.user_metadata?.name ??
      user.email ??
      "Account";
    const avatar = user.user_metadata?.avatar_url as string | undefined;

    return (
      <div className="pointer-events-auto flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-full border border-canvas-border/60 bg-canvas-surface/90 py-1 pl-1 pr-2">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatar}
              alt=""
              className="h-7 w-7 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-canvas-accent/20 text-xs font-medium text-canvas-accent">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="max-w-[120px] truncate text-xs text-canvas-ink">
            {name}
          </span>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await signOut();
            } finally {
              setBusy(false);
            }
          }}
          className="rounded-full border border-canvas-border/60 bg-canvas-surface/90 px-3 py-1.5 text-xs text-canvas-muted transition hover:text-canvas-ink disabled:opacity-50"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await signInWithGoogle();
        } finally {
          setBusy(false);
        }
      }}
      className="pointer-events-auto flex items-center gap-2 rounded-full border border-canvas-border/60 bg-canvas-surface/90 px-3 py-1.5 text-xs text-canvas-ink transition hover:border-canvas-accent/40 disabled:opacity-50"
    >
      <GoogleIcon />
      Sign in with Google
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
