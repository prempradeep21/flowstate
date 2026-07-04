import { notFound } from "next/navigation";
import { StickmanPlaygroundApp } from "@/app/admin/ideas/canvas-pet-stickman/playground/StickmanPlaygroundApp";

/** Dev-only mirror of the Canvas Pet — Stickman idea playground. */
export default function PetPlaygroundDevPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <div className="h-dvh bg-canvas-bg">
      <StickmanPlaygroundApp />
    </div>
  );
}
