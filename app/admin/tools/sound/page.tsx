import { redirect } from "next/navigation";
import { AdminShell } from "@/app/admin/AdminShell";
import { SoundMappingApp } from "@/app/dev/sound/SoundMappingAppLoader";
import { getAdminUser } from "@/lib/adminAccess.server";

export default async function AdminSoundPage() {
  const user = await getAdminUser();
  if (!user) redirect("/");

  return (
    <AdminShell
      title="Sound Console"
      description="Map seslen sound presets to UI events."
    >
      <div className="h-full min-h-0 overflow-auto">
        <SoundMappingApp />
      </div>
    </AdminShell>
  );
}
