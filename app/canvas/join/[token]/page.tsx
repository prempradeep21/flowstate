"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function JoinCanvasPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const router = useRouter();
  const { user, authLoading, joinViaToken, supabaseConfigured } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void params.then((p) => setToken(p.token));
  }, [params]);

  useEffect(() => {
    if (authLoading || !token) return;

    if (!supabaseConfigured) {
      setError("Sign-in is not configured.");
      return;
    }

    if (!user) {
      void import("@/lib/supabase/client").then(({ createClient }) => {
        const supabase = createClient();
        const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(`/canvas/join/${token}`)}`;
        void supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo },
        });
      });
      return;
    }

    void (async () => {
      const canvasId = await joinViaToken(token);
      if (canvasId) {
        router.replace("/");
      } else {
        setError("This invite link is invalid or has been revoked.");
      }
    })();
  }, [authLoading, joinViaToken, router, supabaseConfigured, token, user]);

  return (
    <main className="flex h-full min-h-screen items-center justify-center bg-canvas-bg p-6">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-canvas-ink">Joining canvas…</h1>
        <p className="mt-2 text-canvas-muted">
          {error ?? (user ? "Setting up your access." : "Redirecting to sign in.")}
        </p>
      </div>
    </main>
  );
}
