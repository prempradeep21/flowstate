import { notFound } from "next/navigation";
import { ArtifactCatalogApp } from "./ArtifactCatalogApp";

/** Dev-only artifact catalog — blocked in production builds. */
export default function ArtifactCatalogPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <ArtifactCatalogApp />;
}
