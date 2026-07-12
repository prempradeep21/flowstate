import { Suspense } from "react";
import { notFound } from "next/navigation";
import { DemoVideoApp } from "./DemoVideoApp";

/** Scripted 15s branching demo scene — local-only, frame-stepped for capture. */
export default function DemoVideoPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <Suspense fallback={<div className="fixed inset-0 bg-canvas-bg" />}>
      <DemoVideoApp />
    </Suspense>
  );
}
