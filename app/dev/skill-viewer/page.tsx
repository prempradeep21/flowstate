import { notFound } from "next/navigation";
import { SkillViewerApp } from "./SkillViewerApp";

/** Dev-only Skill Viewer prototype — blocked in production builds. */
export default function SkillViewerPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <SkillViewerApp />;
}
