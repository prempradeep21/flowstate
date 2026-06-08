"use client";

import {
  RISING_SUN_DPI,
  RISING_SUN_PROJECT_ID,
  RISING_SUN_SCALE,
  RISING_SUN_SDK_URL,
} from "@/components/canvasBackgrounds/risingSunConfig";
import type { BackgroundRenderProps } from "@/components/canvasBackgrounds/types";
import { useReducedMotion } from "@/components/canvasBackgrounds/useReducedMotion";
import { isViewportGesturing } from "@/lib/canvasViewportGuard";
import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
} from "react";
import type { UnicornSceneProps } from "unicornstudio-react/next";

type UnicornSceneComponent = ComponentType<UnicornSceneProps>;

interface UnicornStudioScene {
  resize?: () => void;
  paused?: boolean;
  destroy: () => void;
}

function StaticRisingSunPreview({ className = "" }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 z-0 size-full overflow-hidden ${className}`}
      aria-hidden
      style={{
        background:
          "linear-gradient(to top, #ff8c42 0%, #ffb347 28%, #5b4b8a 62%, #1a1028 100%)",
      }}
    />
  );
}

export function RisingSunBackground({
  animate = true,
  className,
}: BackgroundRenderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<UnicornStudioScene | null>(null);
  const reducedMotion = useReducedMotion();
  const shouldAnimate = animate && !reducedMotion;
  const [UnicornScene, setUnicornScene] = useState<UnicornSceneComponent | null>(
    null,
  );
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);

  useEffect(() => {
    if (!shouldAnimate) {
      setUnicornScene(null);
      return;
    }

    let cancelled = false;
    import("unicornstudio-react/next").then((mod) => {
      if (!cancelled) {
        setUnicornScene(() => mod.default);
      }
    });

    return () => {
      cancelled = true;
      setUnicornScene(null);
    };
  }, [shouldAnimate]);

  useEffect(() => {
    if (!shouldAnimate) return;

    let rafId = 0;

    const tick = () => {
      const shouldPause =
        document.visibilityState === "hidden" || isViewportGesturing();
      if (shouldPause !== pausedRef.current) {
        pausedRef.current = shouldPause;
        setPaused(shouldPause);
        if (sceneRef.current) {
          sceneRef.current.paused = shouldPause;
        }
      }
      rafId = requestAnimationFrame(tick);
    };

    const onVisibility = () => {
      const shouldPause =
        document.visibilityState === "hidden" || isViewportGesturing();
      pausedRef.current = shouldPause;
      setPaused(shouldPause);
      if (sceneRef.current) {
        sceneRef.current.paused = shouldPause;
      }
    };

    rafId = requestAnimationFrame(tick);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [shouldAnimate]);

  useEffect(() => {
    if (!shouldAnimate || !UnicornScene) return;

    const container = containerRef.current;
    if (!container) return;

    const ro = new ResizeObserver(() => {
      sceneRef.current?.resize?.();
    });
    ro.observe(container);

    return () => ro.disconnect();
  }, [shouldAnimate, UnicornScene]);

  if (!shouldAnimate) {
    return <StaticRisingSunPreview className={className} />;
  }

  return (
    <div
      ref={containerRef}
      className={`pointer-events-none absolute inset-0 z-0 size-full overflow-hidden ${className}`}
      aria-hidden
    >
      <StaticRisingSunPreview />
      {UnicornScene ? (
        <UnicornScene
          projectId={RISING_SUN_PROJECT_ID}
          sdkUrl={RISING_SUN_SDK_URL}
          width="100%"
          height="100%"
          scale={RISING_SUN_SCALE}
          dpi={RISING_SUN_DPI}
          lazyLoad={false}
          production
          paused={paused}
          altText="Rising Sun background"
          ariaLabel="Rising Sun animated background"
          className="absolute inset-0 size-full"
          showPlaceholderWhileLoading={false}
          showPlaceholderOnError={false}
          sceneRef={sceneRef}
        />
      ) : null}
    </div>
  );
}
