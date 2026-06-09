import { notFound } from "next/navigation";
import { RepoExplorerApp } from "./RepoExplorerApp";

/** Dev-only Repository Explorer prototype — blocked in production builds. */
export default function RepoExplorerPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <RepoExplorerApp />;
}
