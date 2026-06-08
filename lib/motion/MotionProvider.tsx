"use client";

import { LazyMotion, MotionConfig, domAnimation } from "framer-motion";
import type { ReactNode } from "react";
import { durationSeconds } from "./tokens";

const loadFeatures = () =>
  Promise.resolve(domAnimation);

export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig
        reducedMotion="user"
        transition={{ duration: durationSeconds("standard") }}
      >
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}
