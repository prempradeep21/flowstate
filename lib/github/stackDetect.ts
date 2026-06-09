import type { TechData } from "@/lib/github/types";

const DEP_KEYWORDS: Record<string, string[]> = {
  OpenAI: ["openai"],
  Anthropic: ["@anthropic-ai", "anthropic"],
  Stripe: ["stripe"],
  Firebase: ["firebase"],
  Supabase: ["@supabase", "supabase"],
  AWS: ["@aws-sdk", "aws-sdk"],
  Azure: ["@azure"],
  Twilio: ["twilio"],
  Resend: ["resend"],
  Pinecone: ["@pinecone"],
  Weaviate: ["weaviate"],
  Qdrant: ["qdrant"],
};

const FRONTEND = ["react", "next", "vue", "svelte", "angular", "@solidjs"];
const BACKEND = ["express", "fastify", "hono", "koa", "nestjs", "@nestjs"];
const DATABASE = ["pg", "postgres", "prisma", "@prisma", "mongoose", "drizzle-orm", "better-sqlite3", "@electric-sql"];
const AUTH = ["@clerk", "next-auth", "@auth", "passport", "supabase"];
const PAYMENT = ["stripe", "@stripe"];

function depsFromPackage(pkg: Record<string, unknown>): string[] {
  const all: Record<string, string> = {
    ...(pkg.dependencies as Record<string, string> | undefined),
    ...(pkg.devDependencies as Record<string, string> | undefined),
  };
  return Object.keys(all);
}

function findMatch(deps: string[], needles: string[]): string | undefined {
  for (const dep of deps) {
    const lower = dep.toLowerCase();
    for (const n of needles) {
      if (lower === n || lower.startsWith(`${n}/`) || lower.includes(n)) {
        return dep;
      }
    }
  }
  return undefined;
}

function detectKnownServices(deps: string[]): string[] {
  const found: string[] = [];
  const joined = deps.join(" ").toLowerCase();
  for (const [label, keys] of Object.entries(DEP_KEYWORDS)) {
    if (keys.some((k) => joined.includes(k))) found.push(label);
  }
  return found;
}

export function analyzePackageJson(
  pkg: Record<string, unknown>,
  languages: Record<string, number>,
): TechData {
  const deps = depsFromPackage(pkg);
  const totalBytes = Object.values(languages).reduce((a, b) => a + b, 0) || 1;

  const programmingLanguages = Object.entries(languages)
    .sort((a, b) => b[1] - a[1])
    .map(([name, bytes]) => ({
      name,
      bytes,
      percent: Math.round((bytes / totalBytes) * 1000) / 10,
    }));

  const scripts = (pkg.scripts as Record<string, string> | undefined) ?? {};
  const installCommands: string[] = [];
  if (deps.includes("bun") || scripts.dev?.includes("bun")) {
    installCommands.push("bun install");
  } else {
    installCommands.push("npm install");
  }
  if (scripts.postinstall?.includes("gbrain")) {
    installCommands.push("gbrain apply-migrations --yes");
  }

  return {
    frontendFramework: findMatch(deps, FRONTEND),
    backendFramework: findMatch(deps, BACKEND) ?? (deps.includes("express") ? "express" : undefined),
    database: findMatch(deps, DATABASE),
    hostingPlatform: undefined,
    authenticationProvider: findMatch(deps, AUTH),
    paymentProvider: findMatch(deps, PAYMENT),
    aiProviders: detectKnownServices(deps).filter((d) =>
      ["OpenAI", "Anthropic"].includes(d),
    ),
    programmingLanguages,
    dependencies: detectKnownServices(deps),
    dockerSupport: false,
    installationCommands: installCommands,
    envVarsRequired: [],
  };
}

export function analyzeDockerfile(content: string, tech: TechData): TechData {
  return {
    ...tech,
    dockerSupport: true,
    hostingPlatform: tech.hostingPlatform ?? (content.includes("node") ? "Docker / Node" : "Docker"),
  };
}

export function inferCategory(description: string | null, deps: string[]): string {
  const text = `${description ?? ""} ${deps.join(" ")}`.toLowerCase();
  if (/agent|llm|openai|anthropic|ai|brain|rag|embedding/.test(text)) return "AI Application";
  if (/cli|command-line/.test(text)) return "CLI Tool";
  if (/library|sdk|framework/.test(text)) return "Developer Tool";
  if (/mobile|ios|android|react-native/.test(text)) return "Mobile App";
  if (/desktop|electron/.test(text)) return "Desktop Application";
  return "Developer Tool";
}

export function buildArchitectureSummary(tech: TechData): string {
  const parts: string[] = ["CLI / MCP clients"];
  if (tech.backendFramework) parts.push(tech.backendFramework);
  else parts.push("Bun runtime");
  if (tech.database) parts.push(tech.database);
  else parts.push("PostgreSQL + pgvector");
  if (tech.aiProviders.length) parts.push(tech.aiProviders.join(" + "));
  else parts.push("Multi-provider AI gateway");
  return parts.join(" → ");
}
