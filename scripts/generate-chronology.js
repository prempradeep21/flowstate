const { execSync } = require("child_process");

const SESSION_GAP_MS = 3 * 60 * 60 * 1000;
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

function ordinal(n) {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  switch (n % 10) {
    case 1: return `${n}st`;
    case 2: return `${n}nd`;
    case 3: return `${n}rd`;
    default: return `${n}th`;
  }
}

function periodForHour(h) {
  if (h < 12) return "Morning";
  if (h < 18) return "Afternoon";
  return "Night";
}

function formatTime(date) {
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata",
  });
}

function sessionTitle(date, periodSuffix = "") {
  const ist = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const day = ist.getDate();
  const month = MONTHS[ist.getMonth()];
  const weekday = WEEKDAYS[ist.getDay()];
  const period = periodForHour(ist.getHours());
  const suffix = periodSuffix ? `, ${periodSuffix}` : "";
  return `${ordinal(day)} ${month}, ${weekday}, ${period}${suffix}`;
}

function categorize(subject, body) {
  const s = subject.toLowerCase();
  const text = `${subject} ${body}`.toLowerCase();

  if (/collaborat|invite|realtime|live cursor|share token|contributor|rls|policy recursion/.test(text)) {
    return "Collaboration";
  }
  if (s.includes("port playground") || s.includes("playground layout")) return "Canvas";
  if (/resizable canvas artifacts|floating document|artifact badge|artifact suggestion|structured card bodies|artifact support/.test(text)) {
    return "Artifacts";
  }
  if (/api key gate|session-based key storage/.test(text)) return "Auth & Onboarding";
  if (/ancestor history|context history|conversation store|integrate claude|claude api|wikimedia|stream images/.test(text)) {
    return "API & Context";
  }
  if (/fix\(types\)|vercel build|ambient types|production build|spec viewer/.test(text)) {
    return "Technical";
  }
  if (/multi-canvas|canvas switch|canvas persist|snapshot load|session-based key|session artifact/.test(text)) {
    return "Sessions";
  }
  if (/google auth|oauth|supabase|sign-in|remove api key gate|auth ui/.test(text)) {
    return "Auth & Onboarding";
  }
  if (/plug|connector|follow-up layout|branch card/.test(text)) return "Branching";
  if (/fix\(card\)|remove unsupported zustand|card component|question text|markdown rendering|model selector|photo grid/.test(text)) {
    return "Cards";
  }
  if (/chain layout|canvas layout|canvas grouping|landing experience|layout and ui|layout tests|initial commit|infinite canvas|vertical chain/.test(text)) {
    return "Canvas";
  }
  if (/rebrand|toolbar|sidebar|chat view|group summar|ui improvement|merge ux/.test(text)) {
    return "UI & Navigation";
  }
  if (/google analytics|position docs|position rules/.test(text)) return "Technical";
  return "Technical";
}

function summarize(subject, body) {
  const flatBody = body
    .replace(/\r\n/g, "\n")
    .replace(/Co-[Aa]uthored-by:[^\n]*/g, "")
    .replace(/\n+/g, " ")
    .trim();

  const bodyLine = flatBody
    .split(/(?=\s[-*]\s)/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.replace(/^[-*]\s+/, ""))
    .sort((a, b) => b.length - a.length)[0];

  let cleaned =
    bodyLine && bodyLine.length > 40
      ? bodyLine
      : subject.replace(/^(feat|fix|chore)(\([^)]+\))?:\s*/i, "");

  cleaned = cleaned.replace(/\.$/, "").replace(/\|/g, "\\|");
  if (cleaned.length > 200) cleaned = `${cleaned.slice(0, 197)}…`;
  return cleaned;
}

function parseCommits(raw) {
  return raw
    .split("===COMMIT===\n")
    .slice(1)
    .map((block) => {
      const lines = block.trim().split("\n");
      const [, ai, subject, ...bodyLines] = lines;
      const body = bodyLines.join("\n").trim();
      const date = new Date(ai.replace(" +0530", "+05:30"));
      return { date, subject, body, time: formatTime(date) };
    })
    .sort((a, b) => a.date - b.date);
}

function groupSessions(commits) {
  const sessions = [];
  let current = null;

  for (const commit of commits) {
    const dayKey = commit.date.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    const needsNew =
      !current ||
      current.dayKey !== dayKey ||
      commit.date - current.lastDate > SESSION_GAP_MS;

    if (needsNew) {
      current = { dayKey, commits: [], startDate: commit.date, lastDate: commit.date, endDate: commit.date };
      sessions.push(current);
    }

    current.commits.push(commit);
    current.lastDate = commit.date;
    current.endDate = commit.date;
  }

  return sessions.reverse();
}

function durationLabel(start, end) {
  const ms = end - start;
  if (ms < 60000) return "Single push";
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `~${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `~${h}h ${m}m` : `~${h}h`;
}

function sessionSummary(commits) {
  const topics = commits
    .map((c) => c.subject.replace(/^(feat|fix)(\([^)]+\))?:\s*/i, ""))
    .slice(0, 3)
    .join("; ");
  return topics.length > 100 ? `${topics.slice(0, 97)}…` : topics;
}

function titleForSessions(sessions) {
  const used = new Map();

  return sessions.map((session) => {
    const ist = new Date(session.startDate.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const dayKey = session.dayKey;
    const period = periodForHour(ist.getHours());
    const key = `${dayKey}|${period}`;
    const count = used.get(key) || 0;
    used.set(key, count + 1);
    return sessionTitle(session.startDate, count > 0 ? "earlier" : "");
  });
}

function renderSessions(sessions) {
  const titles = titleForSessions(sessions);

  return sessions
    .map((session, i) => {
      const commits = [...session.commits].reverse();
      const pushCount = commits.length;
      const duration = durationLabel(session.startDate, session.endDate);
      const meta =
        pushCount === 1
          ? `**1 push to \`main\`** · **Single push** · ${sessionSummary(commits)}`
          : `**${pushCount} pushes to \`main\`** · **${duration}** · ${sessionSummary(commits)}`;

      const rows = commits
        .map((c) => {
          const cat = categorize(c.subject, c.body);
          const desc = summarize(c.subject, c.body);
          return `| ${c.time} | ${cat} | ${desc} |`;
        })
        .join("\n");

      return `### Session · ${titles[i]}

${meta}

| Time (IST) | Category | Update |
|---|---|---|
${rows}

---`;
    })
    .join("\n\n");
}

function main() {
  const fs = require("fs");
  const path = require("path");
  const raw = execSync('git log main --format="===COMMIT===%n%H%n%ai%n%s%n%b" --no-merges', {
    encoding: "utf8",
  });
  const commits = parseCommits(raw);
  const sessions = groupSessions(commits);
  const rendered = renderSessions(sessions);

  if (process.argv.includes("--sync")) {
    const specPath = path.join(__dirname, "..", "branch-ai.md");
    let spec = fs.readFileSync(specPath, "utf8");
    const blockStart = spec.match(/Sessions are listed \*\*newest first\*\*\.\r?\n\r?\n---\r?\n\r?\n/);
    const endMatch = spec.match(/\r?\n\r?\n## 2\. Product Vision/);
    if (!blockStart || !endMatch) {
      console.error("Could not locate chronology block in branch-ai.md");
      process.exit(1);
    }
    const head = spec.slice(0, blockStart.index + blockStart[0].length);
    const tail = spec.slice(endMatch.index);
    fs.writeFileSync(specPath, `${head}${rendered}\n${tail}`, "utf8");
    console.log(`Updated chronology in branch-ai.md (${commits.length} commits, ${sessions.length} sessions)`);
    return;
  }

  process.stdout.write(rendered);
}

main();
