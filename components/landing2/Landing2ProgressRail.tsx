"use client";

import { useEffect, useState } from "react";
import { LANDING2_SCENES, type Landing2SceneId } from "@/components/landing2/landing2Copy";
import { playSound } from "@/lib/sounds/engine";

export function Landing2ProgressRail() {
  const [active, setActive] = useState<Landing2SceneId>(LANDING2_SCENES[0]!.id);

  useEffect(() => {
    const root = document.getElementById("landing2-scroll-root");
    if (!root) return;

    const sections = LANDING2_SCENES.map((s) =>
      document.getElementById(s.id),
    ).filter(Boolean) as HTMLElement[];

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) {
          setActive(visible.target.id as Landing2SceneId);
        }
      },
      { root, threshold: [0.25, 0.5, 0.75], rootMargin: "-40% 0px -40% 0px" },
    );

    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <nav
      className="fixed right-4 top-1/2 z-50 hidden -translate-y-1/2 flex-col gap-2 lg:flex"
      aria-label="Story progress"
    >
      {LANDING2_SCENES.map((scene) => (
        <a
          key={scene.id}
          href={`#${scene.id}`}
          title={scene.label}
          onClick={() => void playSound("plug-connect")}
          className={`block h-2 w-2 rounded-full transition-all ${
            active === scene.id
              ? "scale-125 bg-canvas-ink"
              : "bg-canvas-border hover:bg-canvas-muted"
          }`}
          aria-label={scene.label}
          aria-current={active === scene.id ? "step" : undefined}
        />
      ))}
    </nav>
  );
}
