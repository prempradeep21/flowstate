import { isDesktopApp, isLocalhostHostname } from "@/lib/supabase/environment";

/**
 * Localhost uses production Supabase for reads only.
 * Set NEXT_PUBLIC_LOCAL_READ_ONLY=false in .env.local to allow writes on localhost.
 */
export function isLocalReadOnlyClient(hostname?: string): boolean {
  // The packaged desktop app serves from localhost but must read AND write.
  if (isDesktopApp()) return false;

  const override = process.env.NEXT_PUBLIC_LOCAL_READ_ONLY?.trim().toLowerCase();
  if (override === "false") return false;
  if (override === "true") {
    const host =
      hostname ??
      (typeof window !== "undefined" ? window.location.hostname : "");
    return host ? isLocalhostHostname(host) : true;
  }

  const host =
    hostname ??
    (typeof window !== "undefined" ? window.location.hostname : "");
  if (!host) return false;
  return isLocalhostHostname(host);
}
