import type { SDKMessage } from "@cursor/sdk";
import type { SdkBuildStage } from "@/lib/cursorSdk/buildProgressTypes";

const SUBAGENT_LABELS: Record<string, string> = {
  "ui-planner": "Planning UI layout…",
  "ui-implementer": "Building interface…",
  "ui-reviewer": "Reviewing UI quality…",
  "ui-editor": "Updating interface…",
};

const TOOL_LABELS: Record<string, string> = {
  emit_custom_ui: "Saving custom UI artifact…",
  Agent: "Delegating to specialist…",
};

function subagentFromArgs(args: unknown): string | null {
  if (!args || typeof args !== "object") return null;
  const record = args as Record<string, unknown>;
  for (const key of ["agent", "agent_name", "name", "subagent", "subagent_name"]) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

export function labelForToolCall(name: string, args?: unknown): string {
  if (name === "Agent") {
    const sub = subagentFromArgs(args);
    if (sub && SUBAGENT_LABELS[sub]) return SUBAGENT_LABELS[sub];
    return TOOL_LABELS.Agent;
  }
  if (TOOL_LABELS[name]) return TOOL_LABELS[name];
  return `Running ${name}…`;
}

export function resolveActiveSdkBuildStageLabel(
  stages: SdkBuildStage[] | undefined,
): string | null {
  if (!stages?.length) return null;
  const active = stages.find((stage) => stage.status === "active");
  if (active) {
    return active.detail
      ? `${active.label.replace(/…$/, "")} — ${active.detail}`
      : active.label;
  }
  const errored = stages.find((stage) => stage.status === "error");
  if (errored) {
    return errored.detail ?? errored.label;
  }
  return null;
}

export function initialSdkBuildStages(isEdit: boolean): SdkBuildStage[] {
  if (isEdit) {
    return [
      { id: "connect", label: "Connecting to Cursor agent…", status: "active" },
      { id: "orchestrate", label: "Preparing UI update…", status: "pending" },
      { id: "ui-editor", label: "Apply requested changes", status: "pending" },
      { id: "emit", label: "Save to canvas", status: "pending" },
    ];
  }
  return [
    {
      id: "connect",
      label: "Connecting to Cursor agent…",
      status: "active",
    },
    {
      id: "orchestrate",
      label: isEdit ? "Preparing UI update…" : "Orchestrating UI build…",
      status: "pending",
    },
    {
      id: "ui-planner",
      label: "Plan layout & interactions",
      status: "pending",
    },
    {
      id: "ui-implementer",
      label: "Implement HTML, CSS & JS",
      status: "pending",
    },
    {
      id: "ui-reviewer",
      label: "Review artifact constraints",
      status: "pending",
    },
    {
      id: "emit",
      label: "Save to canvas",
      status: "pending",
    },
  ];
}

export class SdkBuildProgressTracker {
  private stages: SdkBuildStage[];

  constructor(
    private readonly emit: (payload: {
      thinking: string;
      sdkBuildStages: SdkBuildStage[];
    }) => void,
    private readonly isEdit: boolean,
  ) {
    this.stages = initialSdkBuildStages(isEdit);
    this.flush("Connecting to Cursor agent…");
  }

  resetForRetry(attempt: number) {
    this.stages = initialSdkBuildStages(this.isEdit);
    this.flush(`Retrying Cursor agent (attempt ${attempt})…`);
  }

  get snapshot(): SdkBuildStage[] {
    return this.stages.map((s) => ({ ...s }));
  }

  private flush(thinking: string) {
    this.emit({ thinking, sdkBuildStages: this.snapshot });
  }

  private setStage(
    id: string,
    patch: Partial<SdkBuildStage>,
    thinking?: string,
  ) {
    const idx = this.stages.findIndex((s) => s.id === id);
    if (idx === -1) return;
    this.stages[idx] = { ...this.stages[idx], ...patch };
    for (let i = 0; i < idx; i++) {
      if (this.stages[i].status === "active") {
        this.stages[i] = { ...this.stages[i], status: "done" };
      }
    }
    this.flush(thinking ?? this.stages[idx].label);
  }

  /** Keep the connect step alive with sub-status while Agent.create/send run. */
  pulseConnect(detail: string, thinking?: string) {
    this.setStage("connect", { status: "active", detail }, thinking ?? detail);
  }

  markRunStarted() {
    this.setStage("connect", { status: "done" }, "Starting UI agent…");
    this.setStage("orchestrate", { status: "active" });
  }

  markComplete(thinking = "Custom UI saved.") {
    for (const stage of this.stages) {
      if (
        stage.status === "active" ||
        stage.status === "pending" ||
        stage.status === "error"
      ) {
        stage.status = "done";
        stage.detail = undefined;
      }
    }
    this.flush(thinking);
  }

  markError(message: string) {
    const active = this.stages.find((s) => s.status === "active");
    if (active) {
      active.status = "error";
      active.detail = message;
    }
    this.flush(message);
  }

  handleStreamEvent(event: SDKMessage) {
    switch (event.type) {
      case "system":
        if (event.subtype === "init") {
          this.markRunStarted();
        }
        break;
      case "thinking": {
        const snippet = event.text.trim().slice(0, 80);
        const detail = snippet ? `${snippet}${event.text.length > 80 ? "…" : ""}` : undefined;
        this.setStage(
          "orchestrate",
          { status: "active", detail },
          detail ? `Reasoning: ${detail}` : "Reasoning…",
        );
        break;
      }
      case "tool_call": {
        const name = event.name;
        const label = labelForToolCall(name, event.args);
        if (name === "Agent") {
          const sub = subagentFromArgs(event.args);
          if (sub && this.stages.some((s) => s.id === sub)) {
            if (event.status === "running") {
              this.setStage(sub, { status: "active" }, label);
            } else if (event.status === "completed") {
              this.setStage(sub, { status: "done" }, label);
            } else if (event.status === "error") {
              this.setStage(sub, { status: "error", detail: "Subagent failed" }, label);
            }
            break;
          }
        }
        if (name === "emit_custom_ui") {
          if (event.status === "running") {
            this.setStage("emit", { status: "active" }, label);
          } else if (event.status === "completed") {
            this.setStage("emit", { status: "done" }, "Artifact saved.");
          } else if (event.status === "error") {
            this.setStage("emit", { status: "error", detail: "Save failed" }, label);
          }
          break;
        }
        if (event.status === "running") {
          this.flush(label);
        }
        break;
      }
      case "status":
        if (event.status === "CREATING") {
          this.setStage("connect", { status: "active" }, "Starting Cursor agent…");
        } else if (event.status === "RUNNING") {
          this.markRunStarted();
        }
        // Terminal failure is decided by run.wait(); stream ERROR can precede retry.
        break;
      case "task":
        if (event.text?.trim()) {
          this.setStage(
            "orchestrate",
            { status: "active", detail: event.text.trim().slice(0, 120) },
            event.text.trim().slice(0, 120),
          );
        }
        break;
      default:
        break;
    }
  }
}
