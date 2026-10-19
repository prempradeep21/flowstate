import { notFound } from "next/navigation";
import { TranscriptImportPlaygroundApp } from "@/app/admin/ideas/playground/TranscriptImportPlaygroundApp";

/** Throwaway dev mirror of the admin transcript playground — delete after viewing. */
export default function KsPlaygroundDevPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div style={{ height: "100vh" }}>
      <TranscriptImportPlaygroundApp ideaTitle="Conversation → Flowstate" backHref="/" immersive />
    </div>
  );
}
