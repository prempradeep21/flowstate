import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import { DesignPanelApp } from "@/app/admin/tools/design-system/panel/DesignPanelApp";
import type { DesignSystemDocContent } from "@/app/dev/design-system/sections/DocsSection";
import { DESIGN_SYSTEM_DOCS } from "@/lib/designSystemRegistry";

function loadDesignSystemDocs(): DesignSystemDocContent {
  const docs: DesignSystemDocContent = {};
  for (const entry of DESIGN_SYSTEM_DOCS) {
    const filePath = path.join(process.cwd(), entry.path);
    docs[entry.id] = fs.readFileSync(filePath, "utf8");
  }
  return docs;
}

/** Dev-only mirror of the admin design-system control panel. */
export default function DesignPanelDevPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const docs = loadDesignSystemDocs();
  return (
    <div className="h-dvh">
      <DesignPanelApp docs={docs} />
    </div>
  );
}
