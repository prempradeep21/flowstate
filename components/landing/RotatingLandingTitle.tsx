"use client";

import { useEffect, useState } from "react";
import { TextEffect } from "@/components/motion/TextEffect";
import { LANDING_ROTATING_TITLES } from "@/lib/landingTitles";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";

const HOLD_MS = 3200;

export function RotatingLandingTitle({ className }: { className?: string }) {
  const reducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const title = LANDING_ROTATING_TITLES[index];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((i) => (i + 1) % LANDING_ROTATING_TITLES.length);
    }, HOLD_MS);
    return () => window.clearInterval(timer);
  }, []);

  if (reducedMotion) {
    return <span className={className}>{title}</span>;
  }

  return (
    <TextEffect
      as="span"
      preset="slide"
      per="word"
      className={className}
    >
      {title}
    </TextEffect>
  );
}
