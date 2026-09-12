/**
 * Is the UI running inside the Electron desktop app right now?
 *
 * `isDesktopApp()` reads NEXT_PUBLIC_IS_DESKTOP, which is baked at build time
 * by `npm run dist:mac`. That is correct for a packaged build but blind during
 * development: `npm run electron:dev` points the Electron window at the SAME
 * dev server the browser uses, so a build-time flag cannot tell the two apart.
 *
 * The renderer's user agent can — Electron appends `Electron/<version>` and
 * electron/main.js never overrides it.
 *
 * Use this for UI affordances only. The security decision — whether a stdio
 * server may actually spawn a process — stays server-side in
 * isStdioMcpAllowed(), which never trusts a client-supplied signal.
 */
import { isDesktopApp } from "@/lib/supabase/environment";

export function isElectronUserAgent(userAgent: string | undefined): boolean {
  return /\bElectron\//.test(userAgent ?? "");
}

export function isDesktopRuntime(): boolean {
  if (isDesktopApp()) return true;
  if (typeof navigator === "undefined") return false;
  return isElectronUserAgent(navigator.userAgent);
}
