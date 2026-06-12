type CardAskEntry = { cancel: () => void };

const entries = new Map<string, CardAskEntry>();

export function registerCardAsk(
  cardId: string,
  entry: CardAskEntry,
): () => void {
  entries.set(cardId, entry);
  return () => {
    if (entries.get(cardId) === entry) entries.delete(cardId);
  };
}

export function cancelCardAsk(cardId: string): void {
  entries.get(cardId)?.cancel();
  entries.delete(cardId);
}

export function cancelCardAsks(cardIds: Iterable<string>): void {
  for (const cardId of cardIds) cancelCardAsk(cardId);
}
