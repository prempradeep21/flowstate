// Server-side only — never import this in client components.

interface StoredMessage {
  question: string;
  answer: string;
}

interface Conversation {
  id: string;
  parentId: string | null;
  messages: StoredMessage[];
}

const MAX_FULL_HISTORY = 8;
const MAX_DEPTH = 20;

class ConversationStore {
  private convs = new Map<string, Conversation>();

  register(id: string, parentId: string | null): void {
    const existing = this.convs.get(id);
    if (existing) {
      existing.parentId = parentId;
      return;
    }
    this.convs.set(id, { id, parentId, messages: [] });
  }

  /** Hydrate from canvas when in-memory store was cleared (e.g. dev hot reload). */
  seedHistory(
    id: string,
    parentId: string | null,
    messages: StoredMessage[],
  ): void {
    this.register(id, parentId);
    const conv = this.convs.get(id)!;
    if (conv.messages.length === 0 && messages.length > 0) {
      conv.messages = [...messages];
    }
  }

  addMessage(id: string, question: string, answer: string): void {
    const conv = this.convs.get(id);
    if (!conv) return;
    conv.messages.push({ question, answer });
  }

  getContextChain(id: string): {
    history: StoredMessage[];
    systemContext: string | null;
  } {
    const allMessages: StoredMessage[] = [];
    const visited = new Set<string>();
    let depth = 0;

    let current = this.convs.get(id);
    while (current?.parentId && !visited.has(current.id) && depth < MAX_DEPTH) {
      visited.add(current.id);
      depth++;
      const parent = this.convs.get(current.parentId);
      if (!parent) break;
      allMessages.unshift(...parent.messages);
      current = parent;
    }

    if (allMessages.length <= MAX_FULL_HISTORY) {
      return { history: allMessages, systemContext: null };
    }

    const older = allMessages.slice(0, allMessages.length - MAX_FULL_HISTORY);
    const recent = allMessages.slice(-MAX_FULL_HISTORY);
    const systemContext =
      `Earlier in this conversation, the following topics were discussed:\n` +
      older.map((m, i) => `${i + 1}. "${m.question}"`).join("\n");

    return { history: recent, systemContext };
  }
}

// Module-level singleton — lives for the lifetime of the server process.
export const conversationStore = new ConversationStore();
