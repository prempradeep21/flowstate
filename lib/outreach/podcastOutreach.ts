/**
 * Outreach copy deck for the podcaster pilot programme.
 *
 * This is content, not product code — it feeds /outreach, an internal page for
 * choosing messaging. Tokens ({{host}}, {{show}}, {{episode}}, {{topic}},
 * {{ravi}}) are substituted client-side so a variant can be read as it would
 * actually land in someone's inbox.
 */

export type CopyLength = "sentence" | "bullets" | "paragraphs";

export const COPY_LENGTHS: { id: CopyLength; label: string; hint: string }[] = [
  { id: "sentence", label: "One sentence", hint: "DM, comment reply, in-person" },
  { id: "bullets", label: "Five bullets", hint: "Cold email body, LinkedIn" },
  { id: "paragraphs", label: "Two paragraphs", hint: "Warm intro, forwarded email" },
];

/**
 * The three layers of value to the end viewer, in the order they should be
 * demonstrated. Every copy variant is supposed to walk this ladder — a message
 * that stops at layer 1 is indistinguishable from an AI summary tool.
 */
export type ValueLayer = {
  n: number;
  name: string;
  oneLine: string;
  /** What the person watching the episode gets. */
  viewer: string;
  /** Why the podcaster should care. */
  host: string;
  /** How to demonstrate it. */
  proof: string;
  /** What undersells or breaks it. */
  trap: string;
};

export const VALUE_LAYERS: ValueLayer[] = [
  {
    n: 1,
    name: "Pulled up",
    oneLine:
      "Everything named in the episode arrives as a live card with the link already fetched.",
    viewer:
      "No pausing to type a company name into a search bar. Every company, book, paper, person and place mentioned is already open, sitting next to the moment it was said.",
    host: "The looking-up stops happening in someone else's tab. People stay on your page, and the reference stays attached to your episode.",
    proof:
      "The fastest thing to show and the easiest to believe. Put it first in the video and give it ten seconds, no more.",
    trap:
      "This is the floor, not the pitch. Every AI summary tool on earth claims a links list. A message that stops here sounds like one of them.",
  },
  {
    n: 2,
    name: "Shaped",
    oneLine:
      "What was said in numbers becomes the form it should have been in: a chart, a table, a timeline.",
    viewer:
      "Two hours of talking becomes something you can look at. The comparison you half-followed is a table, the growth story you couldn't picture is a chart, the years are a timeline.",
    host: "It makes the episode scannable, which is the only way someone who would never press play gets anything out of it — and occasionally then presses play.",
    proof:
      "The single frame to lead a DM with. It is the one thing that cannot be mistaken for a summary.",
    trap:
      "Only earns its place if every value is honest to what was said. One invented number makes the whole canvas suspect, which is exactly why every figure is a verbatim lift from the transcript.",
  },
  {
    n: 3,
    name: "Carried on",
    oneLine:
      "Any card can be branched from: pick a model, ask, and the answer lands beside what prompted it.",
    viewer:
      "The episode stops being the end of the enquiry and becomes the start of it. An hour later they have their own canvas, and every branch on it grew out of your show.",
    host: "The most engaged part of your audience does its thinking inside your episode rather than in a chat window that has never heard of you.",
    proof:
      "Has to be shown moving — live or on video, in one unbroken take. The moment someone asks their own question is when the meeting turns.",
    trap:
      "The layer nobody believes until they touch it. Described in text it reads as a chatbot bolted onto a page, which is the opposite of what it is. Never lead with it cold.",
  },
];

export type DemoBeat = { time: string; beat: string; note: string };

/** Beat sheet for the 60-second personalised video — the ladder, in order. */
export const DEMO_BEATS: DemoBeat[] = [
  {
    time: "0:00 — 0:05",
    beat: "Their episode, not your logo",
    note: "Open on the canvas already built from their episode with the video playing. Say the episode's name in the first three seconds. No intro card, no music.",
  },
  {
    time: "0:05 — 0:15",
    beat: "Layer 1 · pulled up",
    note: "Pan across the cards for the companies, books and papers they named. 'Everything you mentioned, already open.' Don't linger — this is the cheap part.",
  },
  {
    time: "0:15 — 0:32",
    beat: "Layer 2 · shaped",
    note: "Land on the strongest artifact from their own episode — a table or chart built from numbers they said out loud. Hold it still. This is the frame they screenshot.",
  },
  {
    time: "0:32 — 0:50",
    beat: "Layer 3 · carried on",
    note: "Pull a branch off one card, pick a model, ask the question their own audience would ask, and let the answer land on screen. One unbroken take — cutting here kills it.",
  },
  {
    time: "0:50 — 1:00",
    beat: "The ask",
    note: "Your face, one sentence on what the pilot is, one sentence on what you need from them. No pricing, no roadmap, no thanks-for-watching.",
  },
];

export type Angle = {
  id: string;
  name: string;
  tagline: string;
  /** When this framing is the right one to reach for. */
  when: string;
  /** Where it lands best. */
  channel: string;
  subject: string;
  /** What goes with the message. */
  attach: string;
  /** How it can backfire. */
  risk: string;
  sentence: string;
  bullets: string[];
  paragraphs: string[];
};

export const ANGLES: Angle[] = [
  {
    id: "second-screen",
    name: "The second screen",
    tagline: "Your audience already watches you with a tab open. We built the tab.",
    when:
      "Default opener for a long-form interview show whose audience is clearly researching alongside the episode. Strongest on video-first shows.",
    channel: "Email or Instagram/X DM · works cold",
    subject: "the second screen for {{episode}}",
    attach: "60s screen-recorded walkthrough that opens on their own episode, plus two stills.",
    risk:
      "Assumes you know how their audience behaves. If they think their show is background listening, this reads as a stranger explaining their own show to them.",
    sentence:
      "Your audience watches {{show}} with a second tab open — I built that tab for {{episode}}, and I'd like ninety seconds of your time to show you.",
    bullets: [
      "Nobody watches a two-hour interview with nothing else open — people pause to look up a name, screenshot a number, open three tabs and abandon two.",
      "First, everything you named is already pulled up: every company, book, paper, person and place from the episode arrives as a live card with the link fetched, so nobody has to go and type it into a search bar.",
      "Then it gets shaped — the numbers you talked through become a chart, the comparison becomes a table, the years become a timeline. Two hours of talking becomes something a person can look at.",
      "And it doesn't stop there: any card can be pulled into a branch, so someone picks whichever model they trust, asks their own follow-up, and the answer lands right beside the moment that prompted it.",
      "Your video plays in the middle of all of it. The input on your side is one paste — transcript and the unlisted link — and the canvas is finished before you publish. Here's the 60-second version of the one I built from {{episode}}: [link].",
    ],
    paragraphs: [
      "Hi {{host}} — I'm Prem, and {{ravi}} We build Flowstate: an infinite canvas where research sits in space instead of scrolling past you in a chat window. I'm writing because of something specific about how people watch {{show}}. Almost nobody watches it with nothing else open. They pause to look up a name, screenshot a chart, open three tabs and abandon two of them. All of that work happens off your page, most of it gets lost, and none of it comes back to you.",
      "So we built the other half of the screen. An episode's transcript and its unlisted link go into Flowstate, and about half an hour later there's a canvas of that episode doing three things. Everything you named — every company, book, paper, person and place — is already pulled up as a live card next to the moment it was said. Everything you talked through in numbers is shaped into the form it wanted to be in: a chart, a table, a timeline. And every one of those cards can be branched from, so someone picks the model they trust, asks their own follow-up, and the answer lands on the canvas beside the thing that provoked it. Your video plays in the middle of all of it. Rather than describe that, I built one from {{episode}}: [link], 60 seconds. If it's interesting, I'd like to do the next one with you before you publish — you send the transcript and the unlisted URL, we build it by hand. Nothing to install, nothing to pay.",
    ],
  },
  {
    id: "carry-on",
    name: "Where the episode ends",
    tagline: "Your episode stops. Their thinking doesn't — and right now it happens somewhere else.",
    when:
      "For hosts whose audience visibly does homework: comment sections full of sources, people posting their own notes. Strongest on technical, investing and science shows.",
    channel: "Email aimed at a call · needs to be seen moving to land",
    subject: "what your audience does in the ten minutes after {{episode}}",
    attach:
      "A recording of the branch moment specifically — click a card, pick a model, ask, watch the answer land. That single unbroken interaction is the whole pitch.",
    risk:
      "This is the layer nobody believes until they touch it. Written down it sounds like a chatbot bolted onto a page, which is precisely what it isn't.",
    sentence:
      "The most engaged part of your audience keeps going after the episode ends — they just do it in a chat window that has never heard of you, and a canvas is where they'd do it without leaving.",
    bullets: [
      "The people who matter most to you don't stop when the episode does — they look something up, argue with a claim, chase one thread for an hour.",
      "All of that happens in a search bar and a chat window today, neither of which has any idea your episode exists, and none of it comes back to you.",
      "On a canvas every card is a starting point: pull a branch off the claim that provoked you, pick whichever model you trust, and ask.",
      "The answer lands beside the moment in the episode that caused it, so an hour later that person has their own canvas — and every branch on it grew out of your show.",
      "That's the part I'd rather show you live than describe, because in writing it sounds like a chatbot and it really isn't one.",
    ],
    paragraphs: [
      "Hi {{host}} — I'm Prem, {{ravi}} A question about the ten minutes after an episode of {{show}} finishes. The part of your audience you care about most doesn't stop there. They go and look up the company, they argue with the claim, they chase one thread for an hour and come back with something. Every bit of that happens in a search bar and a chat window, neither of which has any idea your episode exists, and none of it comes back to you.",
      "We build Flowstate: a canvas where research lives in space. For an episode, everything named in it comes back as a live card with the link fetched, and everything you talked through in numbers gets shaped into a chart, a table or a timeline. But the part I actually want to show you is what happens after that — every one of those cards can be branched from. Someone pulls a branch off the claim that provoked them, picks whichever model they trust, asks their question, and the answer lands on the canvas beside the moment that caused it. An hour later they have their own canvas, and every branch on it grew out of your episode. It's a bad thing to describe and a good thing to watch: [link], 60 seconds — or ten minutes live on the canvas I've built from {{episode}}, whichever you'd rather.",
    ],
  },
  {
    id: "co-build",
    name: "Co-build, not launch",
    tagline: "Five shows, built with them rather than for them.",
    when:
      "For hosts who are builders, operators or early-stage themselves, and for anyone who would smell a sales email at ten paces. This is the honest description of where you actually are.",
    channel: "Email · warm intro strongly preferred",
    subject: "building this with five shows — want {{show}} to be one",
    attach: "One still of the canvas. Hold the video back for the reply — the ask is the point here, not the demo.",
    risk:
      "'Pilot' can read as 'unfinished, will waste my time'. Keep the ask visibly small or it sounds like unpaid work.",
    sentence:
      "We're building this with five shows instead of guessing at it in a room, and I'd like {{show}} to be one of the five.",
    bullets: [
      "We're at the point where this should be shaped by five people who actually publish every week, not by two of us arguing in a room.",
      "The pilot is deliberately small: one episode, your transcript and unlisted link, we build the canvas by hand and you tell us what's wrong with it.",
      "Nothing to install, nothing to pay, no exclusivity, and you can stop after one.",
      "What we want from you is the argument — what your audience actually does after an episode, and what you would never put your name on.",
      "What you get is a finished canvas for that episode, yours to publish or bin, and first call on the feature when it ships.",
    ],
    paragraphs: [
      "Hi {{host}} — I'm Prem, {{ravi}} We build Flowstate, a canvas where research lives in space: everything named in an episode pulled up as a live card, the numbers shaped into charts and tables, and any of it branchable so a viewer can carry on asking with the model they choose. We've built the version of it for podcasts far enough to see it works, and we've now got to the part where guessing is expensive. So instead of finishing it and launching it, we're picking five shows to build it with. I'd like {{show}} to be one of them.",
      "Concretely, the pilot is one episode. You send us a transcript and the unlisted link; we build the canvas by hand — chapters, every source and number that came up, the video playing inside it — and we sit on a call while you tell us what's wrong with it. That's the whole commitment: no install, no cost, no exclusivity, and you can walk after the first one. You keep the canvas and can publish it or bin it. What we're actually after is the half hour where you tell us what your audience does after an episode ends, and what you'd never put your name on. If that's worth an hour of your month, I'll send over what we've already built from {{episode}}.",
    ],
  },
  {
    id: "already-built",
    name: "Already built yours",
    tagline: "Don't pitch it. Send it.",
    when:
      "Cold outreach to anyone big enough that a pitch gets deleted. The message is the artifact; the words just get out of its way. This is the default for tier-one names.",
    channel: "DM or email · the shortest thing you send",
    subject: "built this from {{episode}}",
    attach: "The video is the message. 60 seconds, opens on their episode, your face small in the corner, no logo card at the front.",
    risk:
      "Unsolicited work on their content can read as presumptuous, and a rough canvas confirms their worst guess. Only send when the canvas is genuinely good.",
    sentence:
      "I took {{episode}}, built the thing I would otherwise be pitching you, and recorded 60 seconds of me using it — if it's not for you, say so and I'll leave you alone.",
    bullets: [
      "No pitch — I built this from your own episode before writing to you, and the video is 60 seconds that opens on your episode rather than on a logo.",
      "{{episode}} becomes a canvas: every company, book, paper and place you named pulled up as a live card with the link already fetched.",
      "The numbers you talked through are shaped into charts, tables and timelines, and your video plays in the middle of all of it.",
      "Any card can be branched from, so someone watching picks a model, asks their own follow-up, and the answer lands beside the moment that prompted it.",
      "Where it's wrong is the useful part — tell me and I'll fix it the same day. If you want one for the next episode, we build it by hand before you publish: you paste nothing, you pay nothing.",
    ],
    paragraphs: [
      "Hi {{host}} — this will be short, because the point of it is a link rather than an argument. I took {{episode}} and built its canvas in Flowstate: every company, book, paper and place you named pulled up as a live card next to the moment it was said, the numbers you talked through shaped into charts and tables, and your video playing in the middle of it — and every one of those cards can be branched from, so whoever's watching can pick a model and carry on asking without leaving the page. Here it is, and here's 60 seconds of me using it: [link].",
      "If it's not interesting, reply with that and I'll leave you alone — genuinely, no sequence, no follow-ups. If it's interesting but wrong in places, tell me where and I'll fix it and send it back the same day; the places it's wrong are the most useful thing you could give me. And if you want one for the next episode, we'll build it by hand before you publish — you send a transcript and an unlisted link, and that's your entire involvement. {{ravi}}",
    ],
  },
  {
    id: "archive",
    name: "The archive",
    tagline: "An episode stops earning in week two. A canvas doesn't.",
    when:
      "For shows with a deep, genuinely researched back catalogue — company histories, biographies, science. Best where the host is visibly proud of old work that nobody watches now.",
    channel: "Email · pairs with a canvas built from an old episode, not the newest one",
    subject: "the {{show}} archive, made findable",
    attach: "A canvas built from an episode two or three years old — the proof is that it holds up.",
    risk:
      "Implies their old work is dead. Say it wrong and it reads as an insult wrapped in a metric.",
    sentence:
      "{{show}} is some of the best primary material on {{topic}} anywhere, and about a week after each episode almost none of it is findable again — a canvas turns an old episode into somewhere people arrive rather than something they missed.",
    bullets: [
      "An episode gets one week of attention and then becomes a thumbnail nobody scrolls back to.",
      "The value is still inside it — the reading list, the numbers, the argument, the one story nobody else has — it's just locked in audio that can't be searched or linked to.",
      "A canvas gives one episode a durable surface: every source named pulled up as a live card, the numbers shaped into charts and timelines, each piece standing on its own and each linkable.",
      "Someone arriving eight months late gets a reason to press play at the exact minute that matters — and can branch off any card to carry the research on themselves, which an audio file has never let anyone do.",
      "We'd start with the archive rather than the new one — pick the episode you're proudest of that nobody watches any more, and we'll build it.",
    ],
    paragraphs: [
      "Hi {{host}} — I'm Prem, {{ravi}} I've been going back through the {{show}} archive, and the thing that struck me is how much of it is genuinely primary material on {{topic}} — things that exist nowhere else in that form. And then how quickly all of it becomes unreachable. An episode gets its week, and after that it's a thumbnail nobody scrolls back to, with the reading list and the numbers and the actual argument sealed inside audio that can't be searched.",
      "We build Flowstate, a canvas where research lives in space. For an episode, that means chapters laid out left to right, every source, number and claim that came up pulled out as a card beside the moment it was said, and the video playing in the middle so someone can jump straight to the minute that matters. It makes an old episode somewhere people can arrive at, rather than something they feel they missed. I'd like to build one for you, and I'd rather start with the archive than the newest episode — tell me the one you're proudest of that nobody watches any more, and we'll have it back to you inside a week.",
    ],
  },
  {
    id: "show-notes",
    name: "Show notes, done properly",
    tagline: "You already pay someone to make a worse version of this.",
    when:
      "For professionalised shows with a producer, a research assistant and a real publishing checklist. It attaches to a line item that already exists rather than asking them to invent one.",
    channel: "Email · address the producer as much as the host",
    subject: "the show notes for {{episode}}, as a canvas",
    attach: "Side-by-side still: their actual published show notes next to the canvas of the same episode.",
    risk:
      "Frames a new medium as an upgrade to a chore, which caps how big they think it is. It gets the meeting but can lose the ambition.",
    sentence:
      "Your show notes are a links list — this is the same job done properly: the links are live cards, the numbers you talked through are charts and tables, and anyone reading can branch off and ask their own questions without leaving your page.",
    bullets: [
      "Every episode already ships with chapters, a links list and a summary that someone on your team assembles by hand.",
      "A links list is the floor, and here it's automatic: every company, book, paper and place in the transcript comes back as a live card with the link already fetched.",
      "The part a list can never do is shape — the numbers you talked through become a chart, the comparison becomes a table, the years become a timeline. That's the difference between a description of the episode and something a person can look at.",
      "And unlike a post, it doesn't end: any card can be branched from, so a reader picks a model and carries on asking, with the answers landing beside your video instead of in someone else's chat window.",
      "We'll build the first one by hand so you can put it next to what you'd normally post and judge it on that.",
    ],
    paragraphs: [
      "Hi {{host}} — I'm Prem, {{ravi}} A question about the back half of your publishing process rather than the show itself. Every episode of {{show}} goes out with chapters, a links list and a summary, and somebody spends real hours assembling that. It's the right instinct — people do want to follow up on what they just heard — but the artifact is a list, and a list can't hold an argument. It gets read once, if at all.",
      "We build Flowstate, and the version of this for episodes does the same job in three moves. Everything named in the transcript — companies, books, papers, people, places — comes back as a live card with the link fetched, which is your links list, except it builds itself. Everything you talked through in numbers gets shaped into the form it should have been in all along: a chart, a table, a timeline. And then, unlike a post, it doesn't end — any card can be pulled into a branch, so a reader picks a model, asks the follow-up your episode provoked, and the answer lands next to your video rather than in someone else's chat window. It fits the pipeline you already run: when the transcript is ready it goes in with the unlisted link, and the canvas is finished before you publish. I'd like to build the one for {{episode}} by hand, at no cost, so you can put it next to what you'd normally post and judge it against that.",
    ],
  },
  {
    id: "prep-and-publish",
    name: "Prep and publish",
    tagline: "The canvas you research in is the canvas you ship.",
    when:
      "For interviewers who visibly over-prepare and are proud of it. It sells them a tool for themselves first, and the audience-facing part follows for free.",
    channel: "Email or a live demo on a call · best when you can show it moving",
    subject: "your prep for {{episode}}, and what happens to it after",
    attach: "Two canvases of the same guest: the pre-interview research one, and the post-transcript one built from it.",
    risk:
      "Two products in one message. If they only hear 'research tool', the audience-facing pilot — the thing you actually want — disappears.",
    sentence:
      "The research you do before an interview and the thing you hand your audience afterwards can be the same object, and that's the bit I want to test on {{show}}.",
    bullets: [
      "Before an episode you build a picture of a guest: their companies, their numbers, what they've said before, where they've contradicted themselves.",
      "That work currently lives in a doc, gets used once, and dies the day you record.",
      "Flowstate is a canvas where all of it sits in space — sources, charts, quotes, maps — and asking a follow-up question is one click on any card.",
      "After you record, the same canvas takes the transcript and fills in what was actually said — every name pulled up, the numbers shaped into charts — and becomes the thing your audience explores and branches off.",
      "One object, two jobs: your prep before, and the second screen for the episode after.",
    ],
    paragraphs: [
      "Hi {{host}} — I'm Prem, {{ravi}} The thing that made me write is your prep. Whatever it is you do before an interview — the companies, the numbers, the earlier interviews, the place where they contradicted themselves in 2019 — it's obviously substantial, it lives in a doc somewhere, and the day you record it stops existing. That has always seemed like a strange place for the best research in the whole production to end up.",
      "We build Flowstate: an infinite canvas where research lives in space rather than in a scroll — sources, charts, quotes and maps side by side, and asking a follow-up question is one click on any card rather than a new chat. The part I'd like to test with you is what happens next. After you record, the same canvas takes the episode's transcript and fills itself in with what was actually said: chapters, every claim and number, your video playing in the middle. One object doing two jobs — your prep before, and the thing your audience explores after. I've built a canvas from {{episode}} to show what the second half looks like: [link]. Worth twenty minutes?",
    ],
  },
];

export type Region = "India" | "Global";
export type Tier = 1 | 2 | 3;

export type Target = {
  id: string;
  show: string;
  host: string;
  region: Region;
  category: string;
  /** Why the canvas is genuinely better for this show than for the average one. */
  fit: string;
  /** The specific opening move. */
  hook: string;
  /** Realistic path to a human. */
  reach: string;
  /** Why they say no. */
  objection: string;
  tier: Tier;
  angle: string;
  /** A canvas for this show already exists in the repo. */
  assetReady?: boolean;
};

export const TARGETS: Target[] = [
  {
    id: "rooted-stories",
    show: "Rooted Stories",
    host: "Vishnu",
    region: "India",
    category: "Legacy brands and places",
    fit: "Episodes are about a physical place with a hundred-year history — exactly the material that wants maps, street views, timelines and archival photos around the video. Nothing on the canvas is decorative for this show.",
    hook: "The canvas from the Jagadamba Theatre episode is already built. Send it as-is — it is their own first episode, made into something they can post.",
    reach: "Direct DM. Brand new show, small team, no gatekeeper.",
    objection: "Too early to have a distribution problem, and no producer to hand the work to.",
    tier: 1,
    angle: "already-built",
    assetReady: true,
  },
  {
    id: "rana-daggubati",
    show: "The Rana Daggubati Show",
    host: "Rana Daggubati",
    region: "India",
    category: "Film, culture, long-form interview",
    fit: "Guest-driven interviews with a huge cast of films, companies and people per episode — the canvas turns name-dropping into something navigable. Also the single highest-signal logo you could get in India.",
    hook: "Canvas already built from a full episode. Lead with the video, not the deck.",
    reach: "Industry route via {{ravi}} — a warm intro is worth more here than any email.",
    objection: "Big production, and a pilot means adding a step to a pipeline that already ships.",
    tier: 1,
    angle: "already-built",
    assetReady: true,
  },
  {
    id: "neon-show",
    show: "The Neon Show",
    host: "Siddhartha Ahluwalia",
    region: "India",
    category: "Startups and venture",
    fit: "Founder interviews thick with funding rounds, revenue numbers and company history — every episode produces a scoreboard the audience would actually use. Audience is founders, who install things.",
    hook: "Build a canvas for a recent founder episode and show the company scoreboard — metrics, rounds, timeline — beside the video.",
    reach: "Direct email or LinkedIn; active and responsive on both.",
    objection: "Volume show — anything that adds pre-publish work is a hard sell.",
    tier: 1,
    angle: "second-screen",
  },
  {
    id: "lightcone",
    show: "Lightcone / Y Combinator",
    host: "Garry Tan and partners",
    region: "Global",
    category: "Startups",
    fit: "Advice-dense episodes where the audience is explicitly there to act on what's said. The YC interview-tips canvas in the repo is already the proof.",
    hook: "The YC interview canvas already exists — send it with 'we built this from your own advice episode'.",
    reach: "Founder network, HN, or the YC media team. Hard but not closed.",
    objection: "Institutional; a media team will want to know what it costs them if it's bad.",
    tier: 2,
    angle: "already-built",
    assetReady: true,
  },
  {
    id: "latent-space",
    show: "Latent Space",
    host: "swyx and Alessio",
    region: "Global",
    category: "AI engineering",
    fit: "The audience is engineers who will click into the canvas, take it apart and post about it. They already publish annotated notes, so the gap you're filling is one they've admitted exists.",
    hook: "Build one from an episode with heavy paper and repo references and hand it over as a working artifact, not a demo.",
    reach: "Very reachable — X DM, Discord, or their own show-notes repo.",
    objection: "They'll ask why it isn't self-serve yet, and they may just build a version themselves.",
    tier: 1,
    angle: "co-build",
  },
  {
    id: "dwarkesh",
    show: "Dwarkesh Podcast",
    host: "Dwarkesh Patel",
    region: "Global",
    category: "Ideas, science, AI",
    fit: "The best conceptual fit anywhere. He already publishes annotated transcripts with links and inline commentary — you're offering the medium his annotations are straining against.",
    hook: "Take an episode where his published annotations are heaviest and show the same content as a canvas.",
    reach: "Small team, public email, replies to specific and unusual things.",
    objection: "He has strong opinions on presentation and has already invested in his own format.",
    tier: 1,
    angle: "show-notes",
  },
  {
    id: "acquired",
    show: "Acquired",
    host: "Ben Gilbert and David Rosenthal",
    region: "Global",
    category: "Company history",
    fit: "Four-hour company deep dives — the exact shape of the company canvas skill you already have. Segments, revenue, market cap, chapters, the whole thing already maps.",
    hook: "The Walt Disney demo asset is already in the repo. Build it out properly and send it with nothing else in the email.",
    reach: "Hard. Very large show with sponsors and a team. Route through a mutual or through their Slack community.",
    objection: "They've built their own research process over years and won't outsource the crown jewels.",
    tier: 2,
    angle: "already-built",
  },
  {
    id: "founders",
    show: "Founders",
    host: "David Senra",
    region: "Global",
    category: "Biography",
    fit: "One biography per episode, and the audience's whole ritual is taking notes to reuse later. A canvas is what his listeners are already trying to build by hand.",
    hook: "The research-canvas skill produces exactly his artifact. Build one from an episode about a founder he's returned to more than once.",
    reach: "Active on X, engages with people who make things about his work.",
    objection: "Sells his own notes as the product — this could look like competition.",
    tier: 2,
    angle: "archive",
  },
  {
    id: "knowledge-project",
    show: "The Knowledge Project",
    host: "Shane Parrish",
    region: "Global",
    category: "Decision-making",
    fit: "Farnam Street's entire business is turning conversation into durable, referenceable knowledge. This is that, but spatial.",
    hook: "Lead with the archive angle — his back catalogue is treated as a library already.",
    reach: "Established media operation; needs a warm intro.",
    objection: "Already monetises the artifact layer and will ask where this sits against it.",
    tier: 2,
    angle: "archive",
  },
  {
    id: "invest-like-the-best",
    show: "Invest Like the Best / Colossus",
    host: "Patrick O'Shaughnessy",
    region: "Global",
    category: "Investing",
    fit: "Colossus already builds transcript products and research summaries — they've proven they'll spend money on this layer. Company-heavy episodes suit the scoreboard canvas.",
    hook: "Pitch the team, not the host. Show a canvas of a company episode with the metrics band on top.",
    reach: "Business development contact is public; they take partnership mail seriously.",
    objection: "They may want to own it, which turns a pilot into a licensing conversation.",
    tier: 2,
    angle: "show-notes",
  },
  {
    id: "business-breakdowns",
    show: "Business Breakdowns",
    host: "Colossus / rotating hosts",
    region: "Global",
    category: "Company analysis",
    fit: "One company per episode, structured almost identically to your company-canvas output. Least translation work of anything on this list.",
    hook: "Build one from a recent breakdown and put the two structures side by side.",
    reach: "Same door as Colossus — one conversation covers both.",
    objection: "Same team, same ownership question.",
    tier: 2,
    angle: "show-notes",
  },
  {
    id: "huberman",
    show: "Huberman Lab",
    host: "Andrew Huberman",
    region: "Global",
    category: "Science and health",
    fit: "Protocol-driven episodes where the audience is trying to extract instructions and citations. Canvas already built from the neuroplasticity essentials.",
    hook: "Send the existing canvas to the production team, not to him.",
    reach: "Very hard. Large operation, heavy inbound.",
    objection: "Citation accuracy is a legal and reputational risk for them — one wrong number is a real problem.",
    tier: 3,
    angle: "already-built",
    assetReady: true,
  },
  {
    id: "mindscape",
    show: "Mindscape",
    host: "Sean Carroll",
    region: "Global",
    category: "Science",
    fit: "Solo academic with a note-taking audience and no production layer to negotiate with. Dense in exactly the way that makes a canvas earn its place.",
    hook: "A canvas of a physics episode with the definitions and mechanisms pulled out — the artifacts his audience writes down by hand.",
    reach: "Public email, one person, known to answer.",
    objection: "Might consider it a distraction from the audio he actually cares about.",
    tier: 2,
    angle: "second-screen",
  },
  {
    id: "puliyabaazi",
    show: "Puliyabaazi",
    host: "Pranay Kotasthane and Saurabh Chandra",
    region: "India",
    category: "Policy",
    fit: "Policy episodes built on papers and data, with a listener base that reads the references. Small, thoughtful, and used to publishing reading lists.",
    hook: "Take an episode with a heavy reading list and show the references as live cards.",
    reach: "Direct email; both hosts are accessible and write publicly.",
    objection: "Small team, no budget, and they may not feel the need.",
    tier: 1,
    angle: "show-notes",
  },
  {
    id: "daily-brief",
    show: "The Daily Brief (Zerodha)",
    host: "Zerodha / Varsity team",
    region: "India",
    category: "Markets and business",
    fit: "Daily news explainers full of numbers and charts that would be far better seen than heard, from an organisation that already invests heavily in explanatory content.",
    hook: "Chart-heavy canvas of a single day's episode — the fastest possible before/after.",
    reach: "Zerodha is unusually open to product experiments; reachable via their content team.",
    objection: "Daily cadence — a 30-minute build per episode has to be provably automatic.",
    tier: 2,
    angle: "prep-and-publish",
  },
  {
    id: "wtf-nikhil-kamath",
    show: "People by WTF / WTF is",
    host: "Nikhil Kamath",
    region: "India",
    category: "Business and culture",
    fit: "Multi-guest episodes with a huge surface of companies and claims per episode. The biggest reach in the Indian business podcast space.",
    hook: "A canvas of a multi-guest episode showing how the canvas keeps three speakers' threads separate.",
    reach: "Needs a real introduction — worth spending {{ravi}}'s strongest connection on.",
    objection: "Scale and a large team mean a pilot has to be near zero effort for them.",
    tier: 2,
    angle: "second-screen",
  },
  {
    id: "raj-shamani",
    show: "Figuring Out",
    host: "Raj Shamani",
    region: "India",
    category: "Business interviews",
    fit: "High volume, business-dense, and an audience that clips and re-shares constantly. Distribution-minded host who thinks about audience artifacts.",
    hook: "Lead with the clip-and-share consequence: every card is a shareable object with his link on it.",
    reach: "Active on Instagram and LinkedIn; team responds to specific pitches.",
    objection: "Sponsorship-driven; will ask what the commercial shape is early.",
    tier: 2,
    angle: "second-screen",
  },
  {
    id: "prakhar-gupta",
    show: "Prakhar ke Pravachan",
    host: "Prakhar Gupta",
    region: "India",
    category: "Business explainer and interviews",
    fit: "Explainer-led episodes where the argument is the product — a canvas holds an argument better than a description does.",
    hook: "Canvas from a business-explainer episode, with the claim and mechanism cards front and centre.",
    reach: "Direct DM; independent operation.",
    objection: "Fast turnaround style may not tolerate an extra pre-publish step.",
    tier: 2,
    angle: "show-notes",
  },
  {
    id: "lennys",
    show: "Lenny's Podcast",
    host: "Lenny Rachitsky",
    region: "Global",
    category: "Product",
    fit: "Audience is product people who evaluate tools for a living — the highest-conversion audience on this list, and he already ships heavily structured notes.",
    hook: "Show the canvas as a product artifact, and be ready for him to ask about the business.",
    reach: "Public and responsive, but drowning in inbound from exactly this category.",
    objection: "Gets pitched constantly by tools that want his audience.",
    tier: 2,
    angle: "co-build",
  },
  {
    id: "search-engine",
    show: "Search Engine",
    host: "PJ Vogt",
    region: "Global",
    category: "Narrative journalism",
    fit: "One question investigated per episode, with a real trail of sources and places. The canvas can be the investigation board — a different and more visual demo than the interview shows.",
    hook: "Build the investigation board for one episode: places on a map, sources on a timeline.",
    reach: "Small team, but a production company sits behind it.",
    objection: "Narrative craft is the point for them; structure may feel like it spoils the story.",
    tier: 3,
    angle: "archive",
  },
  {
    id: "twenty-vc",
    show: "20VC",
    host: "Harry Stebbings",
    region: "Global",
    category: "Venture",
    fit: "Extremely high volume and openly competitive on format — a differentiator that costs him nothing is an easy yes if it works.",
    hook: "Volume framing: this has to be automatic, and here is the one we did in half an hour.",
    reach: "Very responsive to direct, short, confident messages.",
    objection: "Attention span of one message — if it isn't obvious in ten seconds it's gone.",
    tier: 3,
    angle: "already-built",
  },
];

export type PlaybookSection = {
  id: string;
  title: string;
  lede: string;
  items: { head: string; body: string }[];
};

export const PLAYBOOK: PlaybookSection[] = [
  {
    id: "ladder",
    title: "The ladder",
    lede: "Four rungs. Each one costs you more than the last, so never climb one before the previous has been answered. The mistake is putting the whole ladder in the first message.",
    items: [
      {
        head: "1 · One still, one sentence",
        body: "A single screenshot of their own episode as a canvas, plus the one-sentence variant. This is a DM. Its only job is a reply — not a meeting, not a demo.",
      },
      {
        head: "2 · The 60-second video",
        body: "Screen recording that opens on their episode with your face small in the corner. No logo card, no music, no 'introducing'. First five seconds: 'this is your episode from three weeks ago'. Last five: what you want.",
      },
      {
        head: "3 · Ten minutes live on their canvas",
        body: "Not a deck. Share the canvas, let them drive, ask a question from their own episode and let the answer land on the canvas in front of them. The moment that converts is them asking their own follow-up.",
      },
      {
        head: "4 · The pilot",
        body: "One episode, built by hand, before they publish. Ask for it only after rung three, and only in the same conversation — never as a follow-up email.",
      },
    ],
  },
  {
    id: "ask",
    title: "The ask",
    lede: "Every message ends with exactly one ask, and it should be the smallest one that still moves. Two asks in a message reads as a pitch.",
    items: [
      {
        head: "Ask for a look, not a call",
        body: "'Ninety seconds of your time' beats 'twenty minutes on a call' by a wide margin, and a reply to the first makes the second easy.",
      },
      {
        head: "Name the effort on their side, in units",
        body: "'A transcript and an unlisted link, once' is the entire input. Say it explicitly — creators are protecting a pipeline, not a budget.",
      },
      {
        head: "Give them the exit",
        body: "'If it's not for you, say so and I'll leave you alone' materially raises reply rates, and you must actually honour it.",
      },
      {
        head: "Never ask for a promotion",
        body: "Do not ask them to post it, mention it, or link it in the first three exchanges. If the canvas is good they will do it unprompted, and that's the only version worth having.",
      },
    ],
  },
  {
    id: "ravi",
    title: "Using Ravi",
    lede: "A co-founder credential is a door, not a pitch. Used at the top of the message it does the work of ten sentences; used as the argument it makes the product look weak.",
    items: [
      {
        head: "One clause, early, then never again",
        body: "It belongs in the first sentence as a subordinate clause and nowhere else in the message. The moment it appears twice, the product is no longer the subject.",
      },
      {
        head: "Warm intro beats named credential",
        body: "If Ravi can send a two-line forward, that is worth more than any cold message you can write. Spend the introductions on tier 1 and the names you only get one shot at.",
      },
      {
        head: "Match the credential to the room",
        body: "The version that works for an Indian film-industry show is not the version that works for an AI engineering podcast. Keep two phrasings and pick per target — the Ravi field at the top of this page is meant to be edited per send.",
      },
      {
        head: "Don't let it carry a bad canvas",
        body: "The credential gets the canvas opened. If the canvas is thin, you've spent a connection to show someone something thin.",
      },
    ],
  },
  {
    id: "pilot",
    title: "What the pilot actually is",
    lede: "Be precise about this before the first message goes out, because the first question after 'interesting' is 'so what do you need from me'.",
    items: [
      {
        head: "You do",
        body: "Take the transcript and unlisted URL, build the canvas by hand in the admin playground, return it within 48 hours of receiving the transcript, and fix anything they flag the same day.",
      },
      {
        head: "They do",
        body: "Send one transcript and one unlisted link. Spend thirty minutes on a call reacting to the result. That is the whole contract.",
      },
      {
        head: "They get",
        body: "The finished canvas for that episode, theirs to publish or bin, and a say in what gets built next.",
      },
      {
        head: "You get",
        body: "The one thing you can't build in isolation — what a working creator says is wrong, missing, or embarrassing. Write down every objection verbatim; that transcript is the actual output of the pilot.",
      },
      {
        head: "Stop rule",
        body: "Five shows, then build. If three of the five ask for the same thing, that's the feature. If all five ask for different things, you have the wrong five shows.",
      },
    ],
  },
  {
    id: "sequence",
    title: "Sequencing and follow-up",
    lede: "Three touches, then stop. Anything past three is a sequence, and creators recognise a sequence instantly.",
    items: [
      {
        head: "Day 0 — the artifact",
        body: "Shortest version you have. Video or still, one sentence, one ask.",
      },
      {
        head: "Day 4 — one new thing",
        body: "Never 'bumping this'. Add something: another episode's canvas, a fix, the thing you built because of a public comment they made.",
      },
      {
        head: "Day 11 — the close, with the door open",
        body: "'I'll stop here — if it becomes relevant, the canvas for {{episode}} stays live at this link.' Then actually stop. Leave the link working; people come back months later.",
      },
      {
        head: "Track replies, not sends",
        body: "Twenty considered messages with three replies beats two hundred with none, and the three replies are the entire point.",
      },
    ],
  },
  {
    id: "never",
    title: "Things not to say",
    lede: "Each of these is the sentence that gets the tab closed.",
    items: [
      {
        head: "'AI-powered'",
        body: "Creators are the most AI-pitched people alive right now. Describe what happens on the screen, never the technology that makes it happen.",
      },
      {
        head: "'Revolutionise / transform / reimagine how your audience engages'",
        body: "Every one of these is a sentence with no object in it. Say what appears on the page instead.",
      },
      {
        head: "Roadmaps, pricing, funding, team size",
        body: "None of it is relevant until they've said the canvas is good. Volunteering it signals that you think the canvas isn't enough.",
      },
      {
        head: "Their own numbers back at them",
        body: "Never quote their subscriber count or a view count. It reads as scraped, because it was.",
      },
      {
        head: "'Quick question'",
        body: "It is never a quick question. Open with the thing itself.",
      },
    ],
  },
];

export type Asset = {
  title: string;
  detail: string;
  status: "Built" | "Partial" | "To build";
  path: string;
};

export const ASSETS: Asset[] = [
  {
    title: "Rooted Stories — Jagadamba Theatre",
    detail: "Full episode canvas, chaptered from a transcript with no creator chapters. Ready to send.",
    status: "Built",
    path: "lib/transcriptImport/buildJagadambaCanvasSection.ts",
  },
  {
    title: "The Rana Daggubati Show",
    detail: "Full episode canvas built on the creator's own chapter markers.",
    status: "Built",
    path: "lib/transcriptImport/buildRanaDaggubatiCanvasSection.ts",
  },
  {
    title: "Huberman Lab — neuroplasticity essentials",
    detail: "Solo-episode canvas: mechanisms, protocols and definitions pulled out of a science monologue.",
    status: "Built",
    path: "lib/transcriptImport/buildHubermanCanvasSection.ts",
  },
  {
    title: "Y Combinator — interview tips",
    detail: "Advice-episode canvas. Doubles as the Lightcone opener.",
    status: "Built",
    path: "lib/transcriptImport/buildYcInterviewCanvasSection.ts",
  },
  {
    title: "Acquired — Walt Disney",
    detail: "Source material sitting in demo assets; the company-canvas skill covers the shape. Needs building out before it can be sent.",
    status: "Partial",
    path: "public/demo-assets/acquired-walt-disney.md",
  },
  {
    title: "The 60-second personalised video",
    detail: "Face in the corner, screen share on their episode, walking layers 1 to 3 in order. The beat sheet is on the three-layers tab. Highest-leverage asset on the list, and none of the targets have seen one yet.",
    status: "To build",
    path: "demo-video/",
  },
  {
    title: "The paste-in UI",
    detail: "Deliberately not built for the pilot — canvases are hand-built until five shows have told you what the input should be.",
    status: "To build",
    path: "—",
  },
];

export type Variables = {
  host: string;
  show: string;
  episode: string;
  topic: string;
  ravi: string;
};

export const DEFAULT_VARIABLES: Variables = {
  host: "Vishnu",
  show: "Rooted Stories",
  episode: "the Jagadamba Theatre episode",
  topic: "India's legacy single-screen theatres",
  ravi: "my co-founder is Ravi — [one clause on why that matters to them].",
};

export function fill(text: string, vars: Variables): string {
  return text
    .replace(/\{\{host\}\}/g, vars.host)
    .replace(/\{\{show\}\}/g, vars.show)
    .replace(/\{\{episode\}\}/g, vars.episode)
    .replace(/\{\{topic\}\}/g, vars.topic)
    .replace(/\{\{ravi\}\}/g, vars.ravi);
}

export function renderPlain(angle: Angle, length: CopyLength, vars: Variables): string {
  if (length === "sentence") return fill(angle.sentence, vars);
  if (length === "bullets") return angle.bullets.map((b) => `• ${fill(b, vars)}`).join("\n");
  return angle.paragraphs.map((p) => fill(p, vars)).join("\n\n");
}
