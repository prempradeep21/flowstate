"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { sceneConfig } from "@/lib/landing2/landing2Scenes";
import type { Landing2SceneId } from "@/components/landing2/landing2Copy";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";
import { useLanding2ScrollRoot } from "@/components/landing2/Landing2ScrollProvider";

export function Landing2PinnedSection({
  sceneId,
  children,
  className = "",
}: {
  sceneId: Landing2SceneId;
  children: (props: {
    scrollYProgress: MotionValue<number>;
    pinHeightVh: number;
  }) => ReactNode;
  className?: string;
}) {
  const config = sceneConfig(sceneId);
  const ref = useRef<HTMLElement>(null);
  const scrollRootRef = useLanding2ScrollRoot();
  const reducedMotion = useReducedMotion();
  const [pinHeightVh, setPinHeightVh] = useState(config.pinHeightVh);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () =>
      setPinHeightVh(mq.matches ? config.pinHeightVhMobile : config.pinHeightVh);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [config.pinHeightVh, config.pinHeightVhMobile]);

  const { scrollYProgress } = useScroll({
    target: ref,
    container: scrollRootRef ?? undefined,
    offset: ["start start", "end start"],
  });

  const heightVh = reducedMotion ? 100 : pinHeightVh;

  return (
    <section
      ref={ref}
      id={sceneId}
      data-landing2-scene={sceneId}
      className={`relative scroll-mt-0 ${className}`}
      style={{ height: `${heightVh}vh` }}
    >
      <div className="sticky top-0 h-[100dvh] overflow-hidden">
        {children({ scrollYProgress, pinHeightVh: heightVh })}
      </div>
    </section>
  );
}

export function Landing2SceneTitle({
  eyebrow,
  title,
  body,
  className = "",
  style,
  variant = "default",
  accentColour,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  className?: string;
  style?: CSSProperties;
  variant?: "default" | "hero";
  accentColour?: string;
}) {
  const titleClass =
    variant === "hero"
      ? "whitespace-pre-line font-display text-[clamp(2.25rem,6.5vw,4.5rem)] font-normal leading-[1.02] tracking-[-0.035em] text-canvas-ink"
      : "font-display text-[clamp(1.75rem,4.5vw,3rem)] font-normal leading-[1.08] tracking-[-0.025em] text-canvas-ink";

  return (
    <div className={className} style={style}>
      {eyebrow ? (
        <p
          className="mb-3 text-canvas-micro font-semibold uppercase tracking-[0.2em]"
          style={{ color: accentColour ?? "rgb(var(--canvas-accent))" }}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2 className={titleClass}>{title}</h2>
      {body ? (
        <p className="mt-5 max-w-[36rem] text-canvas-body-lg leading-[1.65] text-canvas-muted">
          {body}
        </p>
      ) : null}
    </div>
  );
}

export function Landing2FadeLayer({
  progress,
  enter,
  exit,
  children,
  className = "",
}: {
  progress: MotionValue<number>;
  enter: [number, number];
  exit: [number, number];
  children: ReactNode;
  className?: string;
}) {
  const opacity = useTransform(
    progress,
    [enter[0], enter[1], exit[0], exit[1]],
    [0, 1, 1, 0],
  );

  return (
    <motion.div className={className} style={{ opacity }}>
      {children}
    </motion.div>
  );
}
