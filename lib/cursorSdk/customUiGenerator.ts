import "@/lib/cursorSdk/polyfillDisposeSymbols";
import fs from "node:fs";
import path from "node:path";
import { Agent, CursorAgentError } from "@cursor/sdk";
import type { SDKMessage } from "@cursor/sdk";
import { CUSTOM_UI_SUBAGENTS } from "@/lib/cursorSdk/customUiSubagents";
import { createEmitCustomUiTool } from "@/lib/cursorSdk/emitCustomUiTool";
import {
  buildCustomUiPrompt,
  type CustomUiHistoryMessage,
} from "@/lib/cursorSdk/customUiPrompt";
import { SdkBuildProgressTracker } from "@/lib/cursorSdk/sdkStageLabels";
import type { SdkBuildStage } from "@/lib/cursorSdk/buildProgressTypes";
import { extractAssistantText } from "@/lib/cursorSdk/extractAssistantText";
import {
  getCursorSdkRuntimeIssue,
  isConnectOrNetworkError,
  shouldFallbackFromCursorSdk,
} from "@/lib/cursorSdk/runtimeCheck";
import type { CustomArtifactPayload } from "@/lib/customArtifactShortcuts";

export const CUSTOM_UI_SANDBOX_DIR = ".cursor-sdk-ui-sandbox";

const MAX_AGENT_ATTEMPTS = 2;
const RETRY_DELAY_MS = 600;
/** Fail fast when the Cursor agent never starts streaming. */
const AGENT_START_TIMEOUT_MS = 120_000;
const CONNECT_HEARTBEAT_MS = 4_000;

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message: string,
  signal?: AbortSignal,
): Promise<T> {
  if (signal?.aborted) {
    return Promise.reject(new Error("Cancelled."));
  }
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new Error("Cancelled."));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
    promise.then(
      (value) => {
        clearTimeout(timer);
        signal?.removeEventListener("abort", onAbort);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        signal?.removeEventListener("abort", onAbort);
        reject(err);
      },
    );
  });
}

export interface RunCustomUiGeneratorInput {
  question: string;
  history: CustomUiHistoryMessage[];
  editingArtifact?: { artifactId: string; payload: unknown } | null;
  onProgress: (payload: {
    thinking: string;
    sdkBuildStages: SdkBuildStage[];
  }) => void;
  onArtifact?: (artifact: CustomArtifactPayload) => void;
  signal?: AbortSignal;
}

export interface RunCustomUiGeneratorResult {
  artifact: CustomArtifactPayload | null;
  assistantText: string;
  agentId?: string;
  runId?: string;
  error?: string;
  /** When true, caller should retry via Claude emit_artifact instead of Cursor SDK. */
  fallbackRecommended?: boolean;
}

function editingPayloadShape(
  payload: unknown,
): { type?: string; title?: string; data?: unknown } | null {
  if (!payload || typeof payload !== "object") return null;
  return payload as { type?: string; title?: string; data?: unknown };
}

function errorMessage(err: unknown): string {
  return err instanceof CursorAgentError
    ? err.message
    : err instanceof Error
      ? err.message
      : String(err);
}

function isSandboxUnsupportedError(err: unknown): boolean {
  return /sandbox/i.test(errorMessage(err));
}

function isRetryableAgentError(err: unknown): boolean {
  if (err instanceof CursorAgentError) {
    return err.isRetryable;
  }
  const msg = errorMessage(err);
  if (isConnectOrNetworkError(msg)) return true;
  return /429|temporarily|busy|wedged|active run/i.test(msg);
}

function formatConnectFailure(err: unknown): string {
  const msg = errorMessage(err);
  if (isConnectOrNetworkError(msg)) {
    const runtimeIssue = getCursorSdkRuntimeIssue();
    if (runtimeIssue?.code === "node_version") {
      return runtimeIssue.message;
    }
    return "Could not connect to the Cursor agent runtime. Check your network and CURSOR_API_KEY, then retry.";
  }
  return msg;
}

function formatAgentRunError(result: {
  result?: string;
  error?: string;
  message?: string;
}): string {
  const detail =
    result.result?.trim() ||
    result.error?.trim() ||
    result.message?.trim() ||
    "";
  if (/Symbol\.dispose is not defined/i.test(detail)) {
    return "Custom UI runtime is outdated (Node.js 22+ required). Restart the dev server after upgrading Node.";
  }
  return detail || "Cursor agent run failed.";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function startConnectHeartbeat(
  progress: SdkBuildProgressTracker,
  signal?: AbortSignal,
): () => void {
  const startedAt = Date.now();
  const steps = [
    "Initializing Cursor runtime…",
    "Starting local agent bridge…",
    "Waiting for agent response…",
  ];
  let tick = 0;
  progress.pulseConnect(steps[0]);
  const timer = setInterval(() => {
    if (signal?.aborted) return;
    tick += 1;
    const elapsed = Math.round((Date.now() - startedAt) / 1000);
    const step = steps[Math.min(steps.length - 1, Math.floor(tick / 2))];
    progress.pulseConnect(`${step} (${elapsed}s)`);
  }, CONNECT_HEARTBEAT_MS);
  return () => clearInterval(timer);
}

/** Cursor SDK sandbox needs bubblewrap/seatbelt — unavailable on Windows. */
function resolveSandboxEnabled(): boolean {
  if (process.env.CUSTOM_UI_SDK_SANDBOX === "true") return true;
  if (process.env.CUSTOM_UI_SDK_SANDBOX === "false") return false;
  return process.platform !== "win32";
}

async function createAgentWithSandbox(
  apiKey: string,
  capture: (payload: CustomArtifactPayload) => void,
  sandboxEnabled: boolean,
) {
  const sandboxCwd = path.join(process.cwd(), CUSTOM_UI_SANDBOX_DIR);
  fs.mkdirSync(sandboxCwd, { recursive: true });
  const local: {
    cwd: string;
    settingSources: [];
    customTools: { emit_custom_ui: ReturnType<typeof createEmitCustomUiTool> };
    sandboxOptions?: { enabled: boolean };
  } = {
    cwd: sandboxCwd,
    settingSources: [],
    customTools: {
      emit_custom_ui: createEmitCustomUiTool(capture),
    },
  };
  if (sandboxEnabled) {
    local.sandboxOptions = { enabled: true };
  }
  return Agent.create({
    apiKey,
    model: { id: "composer-2.5" },
    mode: process.env.CUSTOM_UI_SDK_MODE === "plan" ? "plan" : "agent",
    agents: CUSTOM_UI_SUBAGENTS,
    local,
  });
}

async function runAgentOnce(
  apiKey: string,
  onCapture: (payload: CustomArtifactPayload) => void,
  sandboxEnabled: boolean,
  prompt: string,
  progress: SdkBuildProgressTracker,
  assistantEvents: SDKMessage[],
  signal?: AbortSignal,
): Promise<{
  artifact: CustomArtifactPayload | null;
  agentId?: string;
  runId?: string;
  error?: string;
}> {
  let captured: CustomArtifactPayload | null = null;
  const capture = (payload: CustomArtifactPayload) => {
    captured = payload;
    onCapture(payload);
  };

  let agent: Awaited<ReturnType<typeof Agent.create>> | null = null;
  const stopHeartbeat = startConnectHeartbeat(progress, signal);
  try {
    progress.pulseConnect("Creating Cursor agent…");
    agent = await withTimeout(
      createAgentWithSandbox(apiKey, capture, sandboxEnabled),
      AGENT_START_TIMEOUT_MS,
      "AGENT_CREATE_TIMEOUT",
      signal,
    );
    stopHeartbeat();
    progress.markRunStarted();

    let run: Awaited<ReturnType<NonNullable<typeof agent>["send"]>>;
    try {
      progress.pulseConnect("Sending build prompt…");
      run = await withTimeout(
        agent.send(prompt, { local: { force: true } }),
        AGENT_START_TIMEOUT_MS,
        "AGENT_START_TIMEOUT",
        signal,
      );
    } catch (err) {
      const msg = errorMessage(err);
      if (msg === "AGENT_CREATE_TIMEOUT" || msg === "AGENT_START_TIMEOUT") {
        return {
          artifact: captured,
          error:
            "Cursor agent did not respond in time. Check CURSOR_API_KEY and try again.",
        };
      }
      if (msg === "Cancelled." || signal?.aborted) {
        return { artifact: captured, error: "Cancelled." };
      }
      throw err;
    }

    if (signal?.aborted) {
      if (run.supports("cancel")) await run.cancel();
      return { artifact: captured, error: "Cancelled." };
    }

    try {
      for await (const event of run.stream()) {
        if (signal?.aborted) {
          if (run.supports("cancel")) await run.cancel();
          break;
        }
        if (event.type === "assistant") assistantEvents.push(event);
        progress.handleStreamEvent(event);
      }
    } catch (err) {
      if (signal?.aborted) {
        return { artifact: captured, error: "Cancelled." };
      }
      throw err;
    }

    const result = await run.wait();
    if (result.status === "error") {
      const detail = formatAgentRunError(result);
      return {
        artifact: captured,
        agentId: agent.agentId,
        runId: run.id,
        error: detail,
      };
    }

    if (captured) {
      progress.markComplete("Custom UI saved.");
    } else {
      progress.markError("No custom UI artifact was emitted.");
    }

    return {
      artifact: captured,
      agentId: agent.agentId,
      runId: run.id,
      error: captured
        ? undefined
        : "Custom UI was not saved — emit_custom_ui did not succeed.",
    };
  } finally {
    stopHeartbeat();
    if (agent) {
      try {
        agent.close();
      } catch {
        /* dispose best-effort */
      }
    }
  }
}

export async function runCustomUiGenerator(
  input: RunCustomUiGeneratorInput,
): Promise<RunCustomUiGeneratorResult> {
  const runtimeIssue = getCursorSdkRuntimeIssue();
  if (runtimeIssue) {
    return {
      artifact: null,
      assistantText: "",
      error: runtimeIssue.message,
      fallbackRecommended: true,
    };
  }

  const apiKey = process.env.CURSOR_API_KEY!.trim();

  const editingPayload = editingPayloadShape(input.editingArtifact?.payload);
  const isEdit = editingPayload?.type === "custom";
  const progress = new SdkBuildProgressTracker(input.onProgress, isEdit);

  let captured: CustomArtifactPayload | null = null;
  const onCapture = (payload: CustomArtifactPayload) => {
    captured = payload;
    input.onArtifact?.(payload);
  };

  const assistantEvents: SDKMessage[] = [];
  const prompt = buildCustomUiPrompt({
    question: input.question,
    history: input.history,
    editingPayload,
  });

  let sandboxEnabled = resolveSandboxEnabled();

  try {
    for (let attempt = 0; attempt < MAX_AGENT_ATTEMPTS; attempt++) {
      if (attempt > 0) {
        progress.resetForRetry(attempt + 1);
        await sleep(RETRY_DELAY_MS);
      }

      try {
        const outcome = await runAgentOnce(
          apiKey,
          onCapture,
          sandboxEnabled,
          prompt,
          progress,
          assistantEvents,
          input.signal,
        );

        if (!outcome.error || outcome.artifact) {
          if (outcome.error) {
            progress.markError(outcome.error);
          }
          return {
            artifact: outcome.artifact ?? captured,
            assistantText: extractAssistantText(assistantEvents),
            agentId: outcome.agentId,
            runId: outcome.runId,
            error: outcome.error,
          };
        }

        if (attempt < MAX_AGENT_ATTEMPTS - 1) {
          continue;
        }

        progress.markError(outcome.error);
        return {
          artifact: outcome.artifact ?? captured,
          assistantText: extractAssistantText(assistantEvents),
          agentId: outcome.agentId,
          runId: outcome.runId,
          error: outcome.error,
          fallbackRecommended: isConnectOrNetworkError(outcome.error),
        };
      } catch (err) {
        if (attempt === 0 && sandboxEnabled && isSandboxUnsupportedError(err)) {
          sandboxEnabled = false;
          continue;
        }
        if (attempt < MAX_AGENT_ATTEMPTS - 1 && isRetryableAgentError(err)) {
          continue;
        }
        throw err;
      }
    }

    return {
      artifact: captured,
      assistantText: extractAssistantText(assistantEvents),
      error: "Custom UI agent could not start.",
      fallbackRecommended: true,
    };
  } catch (err) {
    const message = formatConnectFailure(err);
    if (/Symbol\.dispose is not defined/i.test(message)) {
      progress.markError(message);
      return {
        artifact: captured,
        assistantText: extractAssistantText(assistantEvents),
        error:
          "Custom UI runtime is outdated (Node.js 22+ required). Restart the dev server after upgrading Node.",
        fallbackRecommended: true,
      };
    }
    progress.markError(message);
    return {
      artifact: captured,
      assistantText: extractAssistantText(assistantEvents),
      error: message,
      fallbackRecommended: shouldFallbackFromCursorSdk(err),
    };
  }
}
