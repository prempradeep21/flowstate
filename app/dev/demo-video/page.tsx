import { Suspense } from "react";
import { notFound } from "next/navigation";
import { DemoVideoApp } from "./DemoVideoApp";
import { AssetsSceneApp } from "./scenes/assets/AssetsSceneApp";
import { DisneySceneApp } from "./scenes/disney/DisneySceneApp";
import { FreelancerSceneApp } from "./scenes/freelancer/FreelancerSceneApp";
import { JagadambaSceneApp } from "./scenes/jagadamba/JagadambaSceneApp";
import { FreshMenuSceneApp } from "./scenes/freshmenu/FreshMenuSceneApp";
import { LogoSceneApp } from "./scenes/logo/LogoSceneApp";
import { StudioSceneApp } from "./scenes/studio/StudioSceneApp";
import { ShowcaseSceneApp } from "./scenes/showcase/ShowcaseSceneApp";
import { SHOWCASE_SCENE_ID } from "./scenes/showcase/fixtures";
import { STUDIO_SCENE_IDS, type StudioSceneId } from "./scenes/studio/fixtures";
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
      ) : scene === "disney" ? (
        <DisneySceneApp />
      ) : scene === "freelancer" ? (
        <FreelancerSceneApp />
      ) : scene === "jagadamba" ? (
        <JagadambaSceneApp />
      ) : scene === "freshmenu" ? (
        <FreshMenuSceneApp />
      ) : scene === SHOWCASE_SCENE_ID ? (
        <ShowcaseSceneApp />
      ) : scene && (STUDIO_SCENE_IDS as readonly string[]).includes(scene) ? (
        <StudioSceneApp sceneId={scene as StudioSceneId} />
      ) : (
        <DemoVideoApp />
      )}
    </Suspense>
  );
}
