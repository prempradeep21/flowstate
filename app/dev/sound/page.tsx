import { notFound } from "next/navigation";
import { SoundMappingApp } from "./SoundMappingAppLoader";

/** Dev-only sound mapping tool — blocked in production builds. */
export default function SoundMappingPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <SoundMappingApp />;
}
