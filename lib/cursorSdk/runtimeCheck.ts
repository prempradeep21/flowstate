import fs from "node:fs";
import path from "node:path";

const MIN_NODE = { major: 20, minor: 4, patch: 0 };

function parseNodeVersion(version: string): { major: number; minor: number; patch: number } {
  const match = version.match(/^v?(\d+)\.(\d+)\.(\d+)/);
  if (!match) return { major: 0, minor: 0, patch: 0 };
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

export function isNodeVersionSupportedForCursorSdk(
  version = process.versions.node,
): boolean {
  const current = parseNodeVersion(version);
  if (current.major > MIN_NODE.major) return true;
  if (current.major < MIN_NODE.major) return false;
  if (current.minor > MIN_NODE.minor) return true;
  if (current.minor < MIN_NODE.minor) return false;
  return current.patch >= MIN_NODE.patch;
}

function platformPackageName(): string | null {
  switch (process.platform) {
    case "win32":
      return process.arch === "arm64" ? null : "@cursor/sdk-win32-x64";
    case "darwin":
      return process.arch === "arm64"
        ? "@cursor/sdk-darwin-arm64"
        : "@cursor/sdk-darwin-x64";
    case "linux":
      return process.arch === "arm64"
        ? "@cursor/sdk-linux-arm64"
        : "@cursor/sdk-linux-x64";
    default:
      return null;
  }
}

function hasPlatformRuntimePackage(): boolean {
  const pkg = platformPackageName();
  if (!pkg) return false;
  try {
    fs.accessSync(
      path.join(process.cwd(), "node_modules", pkg, "package.json"),
      fs.constants.R_OK,
    );
    return true;
  } catch {
    return false;
  }
}

export interface CursorSdkRuntimeIssue {
  code: "node_version" | "missing_api_key" | "missing_platform_package";
  message: string;
}

/** Returns a blocking issue when the Cursor SDK local runtime cannot start. */
export function getCursorSdkRuntimeIssue(): CursorSdkRuntimeIssue | null {
  if (!process.env.CURSOR_API_KEY?.trim()) {
    return {
      code: "missing_api_key",
      message: "CURSOR_API_KEY is not configured.",
    };
  }
  if (!isNodeVersionSupportedForCursorSdk()) {
    return {
      code: "node_version",
      message: `Node.js ${process.versions.node} is too old for the Cursor SDK (requires >= ${MIN_NODE.major}.${MIN_NODE.minor}.${MIN_NODE.patch}). Upgrade Node or the app will use Claude for custom UI builds.`,
    };
  }
  if (!hasPlatformRuntimePackage()) {
    return {
      code: "missing_platform_package",
      message:
        "Cursor SDK platform package is missing. Run npm install to add @cursor/sdk-* for this OS.",
    };
  }
  return null;
}

export function isConnectOrNetworkError(message: string): boolean {
  return /ConnectError|Socket connection timeout|ERR_SOCKET_CONNECTION_TIMEOUT|ECONNRESET|ETIMEDOUT|fetch failed|network|503|504|internal/i.test(
    message,
  );
}

export function shouldFallbackFromCursorSdk(err: unknown): boolean {
  if (!process.env.ANTHROPIC_API_KEY?.trim()) return false;
  const message =
    err instanceof Error ? err.message : typeof err === "string" ? err : String(err);
  return isConnectOrNetworkError(message);
}
