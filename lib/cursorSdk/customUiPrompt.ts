export interface CustomUiHistoryMessage {
  question: string;
  answer: string;
}

export interface CustomUiPromptInput {
  question: string;
  history: CustomUiHistoryMessage[];
  editingPayload?: { type?: string; title?: string; data?: unknown } | null;
}

const ARTIFACT_RULES = `
Custom UI rules (iframe sandbox):
- Deliver ONLY through emit_custom_ui with { title, html, css?, js?, description? }.
- Self-contained vanilla HTML/CSS/JS — no fetch, CDN, external scripts, or imports.
- Prefer CSS for visuals; JS only when interactivity requires it.
- Do not read, edit, or shell the workspace — no repo tools for artifact delivery.
`.trim();

const ORCHESTRATOR_RULES = `
You orchestrate custom UI generation using subagents:
- New builds: ui-planner (if non-trivial) → ui-implementer → ui-reviewer → fix & re-implement if needed → emit_custom_ui must succeed.
- Simple single widgets (timer, converter, form): skip ui-planner; ui-implementer → optional ui-reviewer.
- Edits to existing UI: ui-editor only — pass full current html/css/js; emit_custom_ui with complete updated payload.
Subagents share emit_custom_ui. The run is incomplete until emit_custom_ui succeeds with valid html.
`.trim();

export function buildCustomUiPrompt(input: CustomUiPromptInput): string {
  const isEdit = input.editingPayload?.type === "custom";
  const parts: string[] = [
    "Build a custom interactive UI artifact for a Flowstate canvas card.",
    ARTIFACT_RULES,
    ORCHESTRATOR_RULES,
  ];

  if (input.history.length > 0) {
    parts.push(
      "Conversation history on this branch:",
      ...input.history.flatMap((turn, i) => [
        `Turn ${i + 1} user: ${turn.question}`,
        `Turn ${i + 1} assistant: ${turn.answer}`,
      ]),
    );
  }

  if (isEdit && input.editingPayload) {
    parts.push(
      "The user is editing an existing custom UI artifact. Apply their request surgically.",
      `Current artifact JSON:\n${JSON.stringify(input.editingPayload, null, 2)}`,
    );
  }

  parts.push(`User request:\n${input.question}`);
  return parts.join("\n\n");
}
