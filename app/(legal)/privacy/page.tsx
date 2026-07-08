import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";
import { renderLegalDocumentHtml } from "@/lib/legal/renderLegalDocument";

export const metadata: Metadata = {
  title: "Privacy Policy — Flowstate",
  description: "Privacy Policy for Flowstate.",
};

export default function PrivacyPage() {
  const html = renderLegalDocumentHtml("privacy-policy.md");

  return <LegalDocumentPage html={html} />;
}
