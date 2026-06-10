/** Suppresses chat-collapse sound while auto-collapse batch updates run. */
let suppressChatCollapseSound = false;

/** Run a store update that mutates collapsedCardIds without playing chat-collapse. */
export function runSilentAutoCollapse(action: () => void): void {
  suppressChatCollapseSound = true;
  try {
    action();
  } finally {
    suppressChatCollapseSound = false;
  }
}

export function isChatCollapseSoundSuppressed(): boolean {
  return suppressChatCollapseSound;
}
