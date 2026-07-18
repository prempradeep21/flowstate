// Server-only helpers for MCP secret storage. Reuses the app's existing
// AES-256-GCM primitives (and encryption key) from the Google connection flow.

import { decryptSecret, encryptSecret } from "@/lib/google/crypto";

export function encryptHeaderMap(headers: Record<string, string>): string {
  return encryptSecret(JSON.stringify(headers));
}

export function decryptHeaderMap(payload: string | null): Record<string, string> {
  if (!payload) return {};
  try {
    const parsed = JSON.parse(decryptSecret(payload)) as Record<string, unknown>;
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "string") out[key] = value;
    }
    return out;
  } catch {
    return {};
  }
}

export { decryptSecret as decryptMcpSecret, encryptSecret as encryptMcpSecret };
