import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getAdminUser } from "@/lib/adminAccess.server";
import "./admin-docs.css";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getAdminUser();
  if (!user) redirect("/");

  return <div className="h-full overflow-hidden">{children}</div>;
}
