import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminShell } from "@/app/admin/AdminShell";
import { PodcasterTable } from "@/app/admin/outreach/PodcasterTable";
import { getAdminUser } from "@/lib/adminAccess.server";
import type { OutreachPodcaster } from "@/lib/outreach/podcasters";
import { listPodcasters } from "@/lib/outreach/podcasters.server";
import { isServiceRoleConfigured } from "@/lib/supabase/serviceRole";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Flowstate — podcaster outreach",
  description: "Every podcaster we're reaching out to, with their canvas, showcase video and copy.",
};

/**
 * One row per podcaster, carrying everything we send them: the episode, the
 * Flowstate canvas, the showcase video and the three copies. It names real
 * hosts and holds unsent drafts, so it lives under /admin behind getAdminUser.
 */
export default async function OutreachPage() {
  const user = await getAdminUser();
  if (!user) redirect("/");

  let rows: OutreachPodcaster[] = [];
  let loadError: string | null = null;
  if (!isServiceRoleConfigured()) {
    loadError = "SUPABASE_SERVICE_ROLE_KEY is not configured.";
  } else {
    try {
      rows = await listPodcasters();
    } catch (error) {
      loadError = (error as Error).message;
    }
  }

  return (
    <AdminShell
      title="Podcaster outreach"
      description="Each podcaster with their episode, Flowstate canvas, showcase video and the email, DM and Flowstate social copy."
    >
      <PodcasterTable initialRows={rows} loadError={loadError} />
    </AdminShell>
  );
}
