"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { useCanvasPersistence } from "@/hooks/useCanvasPersistence";
import { useCollaboration } from "@/hooks/useCollaboration";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useCanvasStore } from "@/lib/store";

import type { CanvasMeta } from "@/lib/canvasPersistence";
import type { CollaborationContextValue } from "@/hooks/useCollaboration";
import type { PersistenceStatus, SaveStatus } from "@/lib/authTypes";

interface AuthContextValue extends CollaborationContextValue {
  user: User | null;
  authLoading: boolean;
  supabaseConfigured: boolean;
  persistenceStatus: PersistenceStatus;
  saveStatus: SaveStatus;
  activeCanvasId: string | null;
  canvases: CanvasMeta[];
  isSwitchingCanvas: boolean;
  switchingCanvasId: string | null;
  switchingCanvasTitle: string | null;
  switchCanvas: (canvasId: string) => Promise<void>;
  createNewCanvas: () => Promise<string | null>;
  renameCanvas: (canvasId: string, title: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  shareModalOpen: boolean;
  setShareModalOpen: (open: boolean) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabaseConfigured = isSupabaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(supabaseConfigured);
  const [persistenceStatus, setPersistenceStatus] =
    useState<PersistenceStatus>("idle");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const setCanvasReadOnly = useCanvasStore((s) => s.setCanvasReadOnly);
  const isRemoteUpdateRef = useRef(false);

  const {
    activeCanvasId,
    canvases,
    switchCanvas,
    createNewCanvas,
    renameCanvas,
    isSwitching: isSwitchingCanvas,
    switchingCanvasId,
    switchingCanvasTitle,
    loadCanvasRow,
    refreshOwnedCanvasList,
    flushSave,
    isDirtyRef,
    isHydratingRef,
  } = useCanvasPersistence({
    user,
    supabaseConfigured,
    persistenceStatus,
    setPersistenceStatus,
    setSaveStatus,
    isRemoteUpdateRef,
  });

  const onCanvasJoined = useCallback(
    async (canvasId: string) => {
      if (!user) return;
      await loadCanvasRow(canvasId, user.id);
    },
    [loadCanvasRow, user],
  );

  const onRefreshCanvasList = useCallback(async () => {
    await refreshOwnedCanvasList();
  }, [refreshOwnedCanvasList]);

  const collaboration = useCollaboration({
    user,
    supabaseConfigured,
    activeCanvasId,
    onCanvasJoined,
    onRefreshCanvasList,
    isRemoteUpdateRef,
    isDirtyRef,
    isHydratingRef,
  });

  useEffect(() => {
    const readOnly =
      Boolean(user && activeCanvasId) && !collaboration.canEdit;
    setCanvasReadOnly(readOnly);
  }, [activeCanvasId, collaboration.canEdit, setCanvasReadOnly, user]);

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
      setUser((prev) => (prev?.id === nextUser?.id ? prev : nextUser));

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

    await flushSave();

    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, [flushSave, supabaseConfigured]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...collaboration,
      user,
      authLoading,
      supabaseConfigured,
      persistenceStatus,
      saveStatus,
      activeCanvasId,
      canvases,
      isSwitchingCanvas,
      switchingCanvasId,
      switchingCanvasTitle,
      switchCanvas,
      createNewCanvas,
      renameCanvas,
      signInWithGoogle,
      signOut,
      shareModalOpen,
      setShareModalOpen,
    }),
    [
      activeCanvasId,
      authLoading,
      canvases,
      collaboration,
      createNewCanvas,
      isSwitchingCanvas,
      switchingCanvasId,
      switchingCanvasTitle,
      persistenceStatus,
      renameCanvas,
      saveStatus,
      shareModalOpen,
      signInWithGoogle,
      signOut,
      supabaseConfigured,
      switchCanvas,
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

export function useCanEditCanvas(): boolean {
  const { canEdit, user, activeCanvasId } = useAuth();
  if (!user || !activeCanvasId) return true;
  return canEdit;
}
