import { Suspense } from "react";
import { notFound } from "next/navigation";
import { DemoVideoApp } from "./DemoVideoApp";
import { AssetsSceneApp } from "./scenes/assets/AssetsSceneApp";
import { LogoSceneApp } from "./scenes/logo/LogoSceneApp";
import { LOGO_VARIANTS, type LogoVariant } from "./scenes/logo/timeline";

/** Scripted demo scenes — local-only, frame-stepped for capture.
 *  ?scene=branching (default, 15s) | ?scene=assets (36s) |
 *  ?scene=logo-* (3s brand idents, see scenes/logo/timeline.ts). */
export default async function DemoVideoPage({
  searchParams,
}: {
  searchParams: Promise<{ scene?: string }>;
}) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }
  const { scene } = await searchParams;

  return (
    <Suspense fallback={<div className="fixed inset-0 bg-canvas-bg" />}>
      {scene && (LOGO_VARIANTS as string[]).includes(scene) ? (
        <LogoSceneApp variant={scene as LogoVariant} />
      ) : scene === "assets" ? (
        <AssetsSceneApp />
      ) : (
        <DemoVideoApp />
      )}
    </Suspense>
  );
}
