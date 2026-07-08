/** Blocks remote canvas hydrates while the user has unsubmitted local edits. */

let activeLocalEditCount = 0;

export function incrementLocalEditGuard(): void {
  activeLocalEditCount += 1;
}

export function decrementLocalEditGuard(): void {
  activeLocalEditCount = Math.max(0, activeLocalEditCount - 1);
  if (activeLocalEditCount === 0) {
    window.dispatchEvent(new CustomEvent("flowstate:local-edits-ended"));
  }
}

export function hasActiveLocalEdits(): boolean {
  return activeLocalEditCount > 0;
}
