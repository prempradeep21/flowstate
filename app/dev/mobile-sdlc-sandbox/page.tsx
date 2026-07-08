import { notFound } from "next/navigation";
import { MobileSdlcSandboxApp } from "./MobileSdlcSandboxApp";

/** Dev-only Mobile SDLC sandbox — blocked in production builds. */
export default function MobileSdlcSandboxPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <MobileSdlcSandboxApp />;
}
