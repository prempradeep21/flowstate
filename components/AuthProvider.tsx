"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { useCanvasPersistence } from "@/hooks/useCanvasPersistence";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

import type { PersistenceStatus, SaveStatus } from "@/lib/authTypes";

interface AuthContextValue {
  user: User | null;
  authLoading: boolean;
  supabaseConfigured: boolean;
  persistenceStatus: PersistenceStatus;
  saveStatus: SaveStatus;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabaseConfigured = isSupabaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(supabaseConfigured);
  const [persistenceStatus, setPersistenceStatus] =
    useState<PersistenceStatus>("idle");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  useCanvasPersistence({
    user,
    supabaseConfigured,
    persistenceStatus,
    setPersistenceStatus,
    setSaveStatus,
  });

  useEffect(() => {
    if (!supabaseConfigured) {
      setAuthLoading(false);
      return;
    }

    const supabase = createClient();
    let cancelled = false;

    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (cancelled) return;

      setUser(session?.user ?? null);
      setAuthLoading(false);
    };

    void init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);

      if (event === "SIGNED_OUT") {
        setSaveStatus("idle");
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [setSaveStatus, supabaseConfigured]);

  const signInWithGoogle = useCallback(async () => {
    if (!supabaseConfigured) return;

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });

    if (error) throw error;
  }, [supabaseConfigured]);

  const signOut = useCallback(async () => {
    if (!supabaseConfigured) return;

    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, [supabaseConfigured]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      authLoading,
      supabaseConfigured,
      persistenceStatus,
      saveStatus,
      signInWithGoogle,
      signOut,
    }),
    [
      authLoading,
      persistenceStatus,
      saveStatus,
      signInWithGoogle,
      signOut,
      supabaseConfigured,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

export function usePersistenceReady(): boolean {
  const { persistenceStatus } = useAuth();
  return persistenceStatus === "ready";
}
