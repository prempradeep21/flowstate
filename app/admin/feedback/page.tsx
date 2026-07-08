import { redirect } from "next/navigation";
import { AdminShell } from "@/app/admin/AdminShell";
import { BetaSuggestionsInbox } from "@/app/admin/feedback/BetaSuggestionsInbox";
import { getAdminUser } from "@/lib/adminAccess.server";

export default async function AdminFeedbackPage() {
  const user = await getAdminUser();
  if (!user) redirect("/");

  return (
    <AdminShell
      title="Beta suggestions"
      description="Feedback submitted from the canvas."
    >
      <BetaSuggestionsInbox />
    </AdminShell>
  );
}
