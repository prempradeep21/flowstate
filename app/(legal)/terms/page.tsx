import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";
import { renderLegalDocumentHtml } from "@/lib/legal/renderLegalDocument";

export const metadata: Metadata = {
  title: "Terms and Conditions — Flowstate",
  description: "Terms and Conditions for using Flowstate.",
};

export default function TermsPage() {
  const html = renderLegalDocumentHtml("terms-and-conditions.md");

  return <LegalDocumentPage html={html} />;
}
