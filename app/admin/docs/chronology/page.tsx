import { redirect } from "next/navigation";
import { AdminShell } from "@/app/admin/AdminShell";
import { SpecSectionViewer } from "@/app/admin/docs/SpecSectionViewer";
import { getAdminUser } from "@/lib/adminAccess.server";
import { getSpecSection } from "@/lib/specViewer/readSpec";
import { renderSpecSectionHtml } from "@/lib/specViewer/renderSection";

export default async function AdminChronologyPage() {
  const user = await getAdminUser();
  if (!user) redirect("/");

  const section = getSpecSection("Chronology");
  if (!section) {
    return (
      <AdminShell title="Shipping log" description="Chronology of updates">
        <div className="p-6 text-canvas-body-sm text-canvas-muted">
          Could not load chronology from branch-ai.md.
        </div>
      </AdminShell>
    );
  }

  const html = renderSpecSectionHtml(section.title, section.body, section.id);
  const shortTitle = section.title.replace(/^\d+\.\s*/, "");

  return (
    <AdminShell title="Shipping log" description={section.meta.desc}>
      <div className="p-4 sm:p-6">
        <SpecSectionViewer
          title={shortTitle}
          description={section.meta.desc}
          html={html}
        />
      </div>
    </AdminShell>
  );
}
