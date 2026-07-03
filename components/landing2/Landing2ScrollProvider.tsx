"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";

type LenisRef = React.MutableRefObject<Lenis | null>;

const Landing2ScrollContext = createContext<{
  lenisRef: LenisRef;
  scrollRootRef: React.RefObject<HTMLElement | null>;
} | null>(null);

export function useLanding2Lenis() {
  return useContext(Landing2ScrollContext)?.lenisRef ?? null;
}

export function useLanding2ScrollRoot() {
  return useContext(Landing2ScrollContext)?.scrollRootRef ?? null;
}

export function Landing2ScrollProvider({ children }: { children: ReactNode }) {
  const reducedMotion = useReducedMotion();
  const lenisRef = useRef<Lenis | null>(null);
  const scrollRootRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    scrollRootRef.current = document.getElementById("landing2-scroll-root");
  }, []);

  useEffect(() => {
    const wrapper = document.getElementById("landing2-scroll-root");
    const content = document.getElementById("landing2-scroll-content");
    if (!wrapper || !content || reducedMotion) return;

    const lenis = new Lenis({
      wrapper,
      content,
      lerp: 0.08,
      smoothWheel: true,
      syncTouch: false,
      autoRaf: true,
    });
    lenisRef.current = lenis;

    return () => {
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [reducedMotion]);

  return (
    <Landing2ScrollContext.Provider value={{ lenisRef, scrollRootRef }}>
      {children}
    </Landing2ScrollContext.Provider>
  );
}
