import { redirect } from "next/navigation";
import { AdminShell } from "@/app/admin/AdminShell";
import { PhilosophyDocsApp } from "@/app/admin/docs/philosophy/PhilosophyDocsApp";
import { getAdminUser } from "@/lib/adminAccess.server";
import {
  getSpecSection,
  readMarkdownFile,
} from "@/lib/specViewer/readSpec";
import { renderSpecSectionHtml } from "@/lib/specViewer/renderSection";

export default async function AdminPhilosophyPage() {
  const user = await getAdminUser();
  if (!user) redirect("/");

  const section = getSpecSection("Philosophy");
  const principlesHtml = section
    ? renderSpecSectionHtml(section.title, section.body, section.id)
    : "<p>Could not load governing principles.</p>";

  const designLanguageMarkdown = readMarkdownFile(
    "docs/design-system/design-language.md",
  );
  const motionLanguageMarkdown = readMarkdownFile("docs/motion-design-language.md");

  return (
    <AdminShell
      title="Philosophy"
      description="Governing principles and design references."
    >
      <PhilosophyDocsApp
        principlesHtml={principlesHtml}
        designLanguageMarkdown={designLanguageMarkdown}
        motionLanguageMarkdown={motionLanguageMarkdown}
      />
    </AdminShell>
  );
}
