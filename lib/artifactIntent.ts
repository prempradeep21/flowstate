/** Detect when the user wants a to-do / checklist artifact from their message. */

const TODO_INTENT =
  /\b(to[- ]?do\s*list|todo\s*list|checklist|task\s*list|action\s*items?|things?\s+to\s+(?:do|bring|pack|prepare)|get\s+ready|packing\s+list|prep\s+list)\b/i;

const TODO_VERBS =
  /\b(create|make|build|generate|give\s+me|show\s+me|need)\b.{0,40}\b(to[- ]?do|checklist|task\s*list)\b/i;

const TODO_ARTIFACT =
  /\b(to[- ]?do|checklist|task\s*list)\s+(artifact|component)\b/i;

export function detectTodoListIntent(question: string): boolean {
  const q = question.trim();
  if (!q) return false;
  return TODO_INTENT.test(q) || TODO_VERBS.test(q) || TODO_ARTIFACT.test(q);
}

export const TODO_INTENT_SYSTEM_NOTE = `
MANDATORY — To-do list request detected:
- You MUST call emit_artifact with type "todo" in this turn.
- Put every task in data.items as { label, checked: false } (add dueDate/priority when useful).
- Keep your text reply to 1–2 short sentences — do NOT list the tasks in prose; the artifact is the deliverable.
- Use a descriptive title, e.g. "UK Visa Appointment Checklist".
`.trim();

/** Detect when the user wants an interactive custom UI artifact. */

const CUSTOM_UI_INTENT =
  /\b(interactive|widget|component|dashboard|timer|calendar|clock|calculator|counter|stopwatch|countdown|form|ui|app)\b/i;

const CUSTOM_BUILD_VERBS =
  /\b(build|create|make|design|show|develop)\b.{0,48}\b(interactive|widget|component|ui|timer|calendar|clock|dashboard|app)\b/i;

const CUSTOM_ARTIFACT =
  /\b(interactive|custom|widget)\s+(artifact|component|ui)\b/i;

export function detectCustomUiIntent(question: string): boolean {
  const q = question.trim();
  if (!q) return false;
  return (
    CUSTOM_UI_INTENT.test(q) ||
    CUSTOM_BUILD_VERBS.test(q) ||
    CUSTOM_ARTIFACT.test(q)
  );
}

export const CUSTOM_UI_THINKING_LABEL = "Building custom component…";
