import { notFound } from "next/navigation";
import { ArtifactStudioApp } from "./ArtifactStudioApp";

/** Dev-only artifact design studio — blocked in production builds. */
export default function ArtifactStudioPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <ArtifactStudioApp />;
}
