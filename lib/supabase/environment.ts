export type SupabaseDeploymentEnv = "dev" | "production";

/** Extract project ref from `https://<ref>.supabase.co`. */
export function getSupabaseProjectRef(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const host = new URL(url).hostname;
    const match = host.match(/^([a-z0-9]+)\.supabase\.co$/i);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export function getSupabaseDeploymentEnv(): SupabaseDeploymentEnv {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_ENV?.trim().toLowerCase();
  return raw === "dev" ? "dev" : "production";
}

export function getConfiguredSupabaseProjectRef(): string | null {
  return getSupabaseProjectRef(process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function getProductionSupabaseProjectRef(): string | null {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_PROD_PROJECT_REF?.trim();
  return raw || null;
}

export function isLocalhostHostname(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]"
  );
}

/**
 * The Electron Mac app serves Next.js from `http://localhost:<port>`, so its
 * hostname looks like localhost-dev. This flag (baked at build time for the
 * desktop build) marks it as a real production client: full read/write, no
 * localhost-dev safety guards. A plain `npm run dev` browser leaves it unset.
 */
export function isDesktopApp(): boolean {
  return process.env.NEXT_PUBLIC_IS_DESKTOP?.trim().toLowerCase() === "true";
}

export type LocalSupabaseSafety =
  | { kind: "not_local" }
  | { kind: "unconfigured" }
  | { kind: "dev_ok"; projectRef: string }
  | { kind: "dev_misconfigured"; projectRef: string; prodProjectRef: string }
  | { kind: "prod_on_localhost"; projectRef: string };

/**
 * Classify whether localhost is safely isolated from production Supabase.
 * Client-safe: only uses NEXT_PUBLIC_* env vars.
 */
export function classifyLocalSupabaseSafety(
  hostname: string,
  options?: {
    deploymentEnv?: SupabaseDeploymentEnv;
    projectRef?: string | null;
    prodProjectRef?: string | null;
    supabaseConfigured?: boolean;
  },
): LocalSupabaseSafety {
  if (!isLocalhostHostname(hostname)) {
    return { kind: "not_local" };
  }

  // The desktop app runs on localhost but is a normal production client.
  if (isDesktopApp()) {
    return { kind: "not_local" };
  }

  const configured = options?.supabaseConfigured ?? Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  if (!configured) {
    return { kind: "unconfigured" };
  }

  const deploymentEnv =
    options?.deploymentEnv ?? getSupabaseDeploymentEnv();
  const projectRef =
    options?.projectRef ?? getConfiguredSupabaseProjectRef();
  const prodProjectRef =
    options?.prodProjectRef ?? getProductionSupabaseProjectRef();

  if (!projectRef) {
    return { kind: "unconfigured" };
  }

  if (deploymentEnv === "dev") {
    if (prodProjectRef && projectRef === prodProjectRef) {
      return {
        kind: "dev_misconfigured",
        projectRef,
        prodProjectRef,
      };
    }
    return { kind: "dev_ok", projectRef };
  }

  return { kind: "prod_on_localhost", projectRef };
}
