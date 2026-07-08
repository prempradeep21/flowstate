"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type DependencyList,
  type ReactNode,
} from "react";
import { useEffect } from "react";
import { useArtifactFontScale } from "@/hooks/useArtifactFontScale";

interface ArtifactMenuControlsContextValue {
  fontScale: number;
  setFontScale: (scale: number) => void;
  showFontControls: boolean;
  menuControlsEnabled: boolean;
  displayExtras: ReactNode | null;
  hasDisplayExtras: boolean;
  hasDisplayMenu: boolean;
  registerDisplayExtras: (node: ReactNode) => () => void;
}

const ArtifactMenuControlsContext =
  createContext<ArtifactMenuControlsContextValue | null>(null);

export function ArtifactMenuControlsProvider({
  children,
  artifactId,
  showFontControls = true,
  menuControlsEnabled = true,
}: {
  children: ReactNode;
  artifactId?: string;
  showFontControls?: boolean;
  menuControlsEnabled?: boolean;
}) {
  const [fontScale, setFontScale] = useArtifactFontScale(artifactId);
  const [displayExtras, setDisplayExtras] = useState<ReactNode | null>(null);
  const [hasDisplayExtras, setHasDisplayExtras] = useState(false);

  const registerDisplayExtras = useCallback((node: ReactNode) => {
    setDisplayExtras(node);
    setHasDisplayExtras(node != null);
    return () => {
      setDisplayExtras(null);
      setHasDisplayExtras(false);
    };
  }, []);

  const effectiveShowFont = showFontControls && menuControlsEnabled;
  const hasDisplayMenu = menuControlsEnabled && (effectiveShowFont || hasDisplayExtras);

  const value = useMemo(
    () => ({
      fontScale,
      setFontScale,
      showFontControls: effectiveShowFont,
      menuControlsEnabled,
      displayExtras,
      hasDisplayExtras,
      hasDisplayMenu,
      registerDisplayExtras,
    }),
    [
      displayExtras,
      effectiveShowFont,
      fontScale,
      hasDisplayExtras,
      hasDisplayMenu,
      menuControlsEnabled,
      registerDisplayExtras,
      setFontScale,
    ],
  );

  return (
    <ArtifactMenuControlsContext.Provider value={value}>
      {children}
    </ArtifactMenuControlsContext.Provider>
  );
}

export function useArtifactMenuControls() {
  return useContext(ArtifactMenuControlsContext);
}

export function useArtifactMenuDisplayExtras(
  enabled: boolean,
  factory: () => ReactNode,
  deps: DependencyList,
) {
  const ctx = useArtifactMenuControls();
  useEffect(() => {
    if (!ctx?.menuControlsEnabled || !enabled) return;
    return ctx.registerDisplayExtras(factory());
    // eslint-disable-next-line react-hooks/exhaustive-deps -- factory captures render deps
  }, [ctx, enabled, ...deps]);
}
