import fs from "fs";
import path from "path";
import { redirect } from "next/navigation";
import { AdminShell } from "@/app/admin/AdminShell";
import { DesignSystemApp } from "@/app/dev/design-system/DesignSystemApp";
import type { DesignSystemDocContent } from "@/app/dev/design-system/sections/DocsSection";
import { getAdminUser } from "@/lib/adminAccess.server";
import { DESIGN_SYSTEM_DOCS } from "@/lib/designSystemRegistry";

function loadDesignSystemDocs(): DesignSystemDocContent {
  const docs: DesignSystemDocContent = {};
  for (const entry of DESIGN_SYSTEM_DOCS) {
    const filePath = path.join(process.cwd(), entry.path);
    docs[entry.id] = fs.readFileSync(filePath, "utf8");
  }
  return docs;
}

export default async function AdminDesignSystemPage() {
  const user = await getAdminUser();
  if (!user) redirect("/");

  const docs = loadDesignSystemDocs();

  return (
    <AdminShell
      title="Design System"
      description="Exportable UI specimens and documentation."
    >
      <div className="h-full min-h-0">
        <DesignSystemApp docs={docs} />
      </div>
    </AdminShell>
  );
}
