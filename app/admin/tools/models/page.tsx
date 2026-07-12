import { redirect } from "next/navigation";
import { AdminShell } from "@/app/admin/AdminShell";
import { ModelSelectionConsole } from "@/app/admin/tools/models/ModelSelectionConsole";
import { getAdminUser } from "@/lib/adminAccess.server";
import { readPublishedModels } from "@/lib/modelConfig/publishedModels.server";
import { MODELS } from "@/lib/models";

export default async function AdminModelsPage() {
  const user = await getAdminUser();
  if (!user) redirect("/");

  const published = readPublishedModels();
  const anthropicModels = MODELS.filter((m) => m.provider === "anthropic").map(
    (m) => ({ id: m.id, label: m.label }),
  );

  return (
    <AdminShell
      title="Model Selection"
      description="Choose and prioritise which models users see in the composer."
    >
      <div className="h-full min-h-0 overflow-auto">
        <ModelSelectionConsole
          initialSelection={published.openrouterModels}
          anthropicModels={anthropicModels}
        />
      </div>
    </AdminShell>
  );
}
