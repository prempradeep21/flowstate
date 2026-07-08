import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import { DesignSystemApp } from "./DesignSystemApp";
import type { DesignSystemDocContent } from "./sections/DocsSection";
import { DESIGN_SYSTEM_DOCS } from "@/lib/designSystemRegistry";

function loadDesignSystemDocs(): DesignSystemDocContent {
  const docs: DesignSystemDocContent = {};
  for (const entry of DESIGN_SYSTEM_DOCS) {
    const filePath = path.join(process.cwd(), entry.path);
    docs[entry.id] = fs.readFileSync(filePath, "utf8");
  }
  return docs;
}

function isDesignSystemRouteAllowed(): boolean {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.DESIGN_SYSTEM_EXPORT === "1"
  );
}

/** Dev-only design system hub — allowed in export builds. */
export default function DesignSystemPage() {
  if (!isDesignSystemRouteAllowed()) {
    notFound();
  }

  const docs = loadDesignSystemDocs();
  return <DesignSystemApp docs={docs} />;
}
