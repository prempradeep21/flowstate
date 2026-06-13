type CardAskEntry = { cancel: () => void };

const entries = new Map<string, CardAskEntry>();
/** Active generation token per card — suppresses stale ask completion. */
const inFlight = new Map<string, number>();
let nextAskToken = 1;

export function registerCardAsk(
  cardId: string,
  entry: CardAskEntry,
): () => void {
  entries.set(cardId, entry);
  return () => {
    if (entries.get(cardId) === entry) entries.delete(cardId);
  };
}

/** Mark a card Q&A request as in flight until the matching token ends. */
export function beginCardAsk(cardId: string): number {
  const token = nextAskToken++;
  inFlight.set(cardId, token);
  return token;
}

export function endCardAsk(cardId: string, token: number): void {
  if (inFlight.get(cardId) === token) inFlight.delete(cardId);
}

export function isCardAskInFlight(cardId: string): boolean {
  return inFlight.has(cardId);
}

export function cancelCardAsk(cardId: string): void {
  entries.get(cardId)?.cancel();
  entries.delete(cardId);
  inFlight.delete(cardId);
}

export function cancelCardAsks(cardIds: Iterable<string>): void {
  for (const cardId of cardIds) cancelCardAsk(cardId);
}
