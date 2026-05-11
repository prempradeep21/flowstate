const SENTENCE_POOL: string[] = [
  "The shape of this question depends on the scale you choose to examine it at.",
  "A useful starting point is to separate the mechanism from the outcome it tends to produce.",
  "Most explanations that feel complete are actually load-bearing on one or two hidden assumptions.",
  "It helps to ask what would have to be true for the opposite conclusion to hold.",
  "Notice that the answer changes meaningfully when you vary the time horizon.",
  "There is a version of this that is mostly a coordination problem and another that is mostly a knowledge problem.",
  "The interesting friction usually lives at the boundary between two systems rather than inside either one.",
  "If you trace the chain of incentives, the surprising behaviour stops being surprising.",
  "What looks like a single phenomenon is often a family of related phenomena with shared vocabulary.",
  "A good test is to imagine the smallest possible example and see whether your reasoning still works there.",
  "The hard part is rarely the first step; it is keeping the constraints stable while you take the second.",
  "Causation here flows in more directions than the prevailing framing suggests.",
];

const BULLET_POOL: string[] = [
  "Start from the smallest example that still exhibits the behaviour.",
  "Separate the mechanism from the outcome it produces.",
  "Name the hidden assumption the argument is leaning on.",
  "Vary the time horizon and watch which conclusions move.",
  "Identify whether this is a coordination or a knowledge problem.",
  "Trace incentives one step further than feels necessary.",
  "Look at the boundary between systems, not the interior.",
  "Ask what would have to be true for the opposite to hold.",
  "Distinguish the phenomenon from its shared vocabulary.",
  "Hold the constraints stable while moving to the next step.",
];

const THINKING_LABELS: string[] = [
  "Thinking",
  "Gathering context",
  "Considering trade-offs",
  "Drafting outline",
  "Cross-referencing sources",
  "Sketching the architecture",
  "Reasoning through edge cases",
  "Weighing alternatives",
];

const FILE_NAMES: string[] = [
  "store.ts",
  "Card.tsx",
  "Canvas.tsx",
  "dummyLLM.ts",
  "layout.tsx",
  "Connections.tsx",
];

const WEB_LABELS: string[] = [
  "Fetching the internet",
  "Searching the web",
  "Checking external references",
];

const PUNCT = /[.,;:!?]/;

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function pickOne<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  const pool = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
}

function pickThinkingLabel(usedFiles: Set<string>): string {
  const roll = Math.random();
  if (roll < 0.3) {
    const remaining = FILE_NAMES.filter((f) => !usedFiles.has(f));
    const file = remaining.length > 0 ? pickOne(remaining) : pickOne(FILE_NAMES);
    usedFiles.add(file);
    return `Reading ${file}`;
  }
  if (roll < 0.45) {
    return pickOne(WEB_LABELS);
  }
  return pickOne(THINKING_LABELS);
}

function makeParagraph(): string {
  const sentences = pickN(SENTENCE_POOL, randInt(2, 4));
  return sentences.join(" ");
}

function makeBulletList(): string {
  const bullets = pickN(BULLET_POOL, randInt(3, 5));
  return bullets.map((b) => `- ${b}`).join("\n");
}

type Segment =
  | { kind: "think"; durationMs: number; label: string }
  | { kind: "text"; text: string; wordIntervalMs: number };

function buildScript(): Segment[] {
  const totalMs = randInt(5_000, 60_000);
  // 1–3 text segments; thinking always precedes a text segment so the script
  // starts on a loader and ends on visible text.
  const textCount = totalMs < 12_000 ? randInt(1, 2) : randInt(2, 3);
  const thinkCount = textCount;

  // Allocate thinking budget: 600ms–8s each, but clamp to a fraction of total.
  const maxThinkBudget = Math.min(totalMs * 0.55, thinkCount * 8_000);
  const thinkBudget = Math.max(
    thinkCount * 600,
    Math.min(maxThinkBudget, randFloat(thinkCount * 800, maxThinkBudget)),
  );
  const thinkSlices = splitBudget(thinkBudget, thinkCount, 600, 8_000);
  const textBudget = Math.max(totalMs - thinkBudget, textCount * 1_200);
  const textSlices = splitBudget(textBudget, textCount, 1_000, 25_000);

  const usedFiles = new Set<string>();
  const segments: Segment[] = [];

  for (let i = 0; i < textCount; i++) {
    segments.push({
      kind: "think",
      durationMs: Math.round(thinkSlices[i]),
      label: pickThinkingLabel(usedFiles),
    });

    // First segment is usually a paragraph; later ones lean toward bullets.
    const wantBullets = i === 0 ? Math.random() < 0.2 : Math.random() < 0.55;
    const text = wantBullets ? makeBulletList() : makeParagraph();
    const wordCount = text.split(/\s+/).length;
    const wordIntervalMs = Math.max(
      25,
      Math.min(80, Math.round(textSlices[i] / Math.max(wordCount, 1))),
    );
    segments.push({ kind: "text", text, wordIntervalMs });
  }

  return segments;
}

function splitBudget(
  total: number,
  parts: number,
  min: number,
  max: number,
): number[] {
  if (parts <= 0) return [];
  // Draw random weights, normalize, then clamp each slice into [min, max].
  const weights = Array.from({ length: parts }, () => Math.random() + 0.1);
  const sum = weights.reduce((a, b) => a + b, 0);
  const raw = weights.map((w) => (w / sum) * total);
  return raw.map((v) => Math.min(max, Math.max(min, v)));
}

export function generateDummyAnswer(): string {
  return makeParagraph();
}

export interface AskCallbacks {
  onThinking: (label: string) => void;
  onToken: (nextAnswer: string) => void;
  onDone: () => void;
}

export interface AskHandle {
  cancel: () => void;
}

export function askDummy(_question: string, cb: AskCallbacks): AskHandle {
  const script = buildScript();

  let cancelled = false;
  const timers: ReturnType<typeof setTimeout>[] = [];
  let streamingInterval: ReturnType<typeof setInterval> | null = null;
  let acc = "";

  const runSegment = (idx: number) => {
    if (cancelled) return;
    if (idx >= script.length) {
      cb.onDone();
      return;
    }
    const seg = script[idx];

    if (seg.kind === "think") {
      cb.onThinking(seg.label);
      timers.push(
        setTimeout(() => {
          if (cancelled) return;
          runSegment(idx + 1);
        }, seg.durationMs),
      );
      return;
    }

    // Text segment: prepend a paragraph break if we already have text.
    if (acc.length > 0) {
      acc = `${acc}\n\n`;
      cb.onToken(acc);
    }
    const words = seg.text.split(" ");
    let i = 0;
    streamingInterval = setInterval(() => {
      if (cancelled) return;
      if (i >= words.length) {
        if (streamingInterval) {
          clearInterval(streamingInterval);
          streamingInterval = null;
        }
        runSegment(idx + 1);
        return;
      }
      const w = words[i++];
      const lastChar = acc.charAt(acc.length - 1);
      const needsSpace =
        acc.length > 0 &&
        lastChar !== "\n" &&
        !PUNCT.test(w.charAt(0));
      acc = needsSpace ? `${acc} ${w}` : `${acc}${w}`;
      cb.onToken(acc);
    }, seg.wordIntervalMs);
  };

  runSegment(0);

  return {
    cancel: () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      if (streamingInterval) clearInterval(streamingInterval);
    },
  };
}
