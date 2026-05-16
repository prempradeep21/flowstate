# Delta — Product Specification
### A Spatial Thinking Canvas for AI-Assisted Inquiry

---

## Table of Contents

1. [Product Vision](#1-product-vision)
2. [Philosophy & Governing Principles](#2-philosophy--governing-principles)
3. [User Stories](#3-user-stories)
4. [Out of Scope](#4-out-of-scope)
5. [Decisions & Design Rationale](#5-decisions--design-rationale)
6. [User Interface Specification](#6-user-interface-specification)
7. [Interaction Model](#7-interaction-model)
8. [Version Roadmap](#8-version-roadmap)
9. [Technical Implementation](#9-technical-implementation)
10. [API Handling](#10-api-handling)
11. [Onboarding](#11-onboarding)
12. [Open Questions](#12-open-questions)
13. [Acceptance Checklist](#13-acceptance-checklist)

---

## 1. Product Vision

Every AI chat product today organises conversations as a list. A vertical scroll of sessions, each one a linear thread. This is a filing cabinet metaphor — and it doesn't reflect how thinking actually works.

Thinking branches. It backtracks. It holds parallel threads simultaneously. A person learning about economics doesn't ask one question and follow it in a straight line. They drill down, get sidetracked, form competing hypotheses, step back to reframe, and eventually find two threads connecting in unexpected ways.

**Delta** is a spatial canvas for AI-assisted thinking. Instead of a list of chats, you get an infinite canvas where every question and answer lives as a card in space. Threads branch like rivers, like neurons, like tree roots — organically, freeform, never auto-arranged.

The name references river deltas — where a single flow splits into many tributaries, each finding its own path, some rejoining, some reaching the sea alone. That is the shape of a thinking session.

**Who it is for (V1):** Developers and power users who have their own LLM API keys and want a better thinking environment than a linear chat interface.

**What problem it solves:** The inability to hold, navigate, and branch parallel lines of inquiry in a single session without losing context or spatial orientation.

---

## 2. Philosophy & Governing Principles

### Branching is universal

The branching pattern appears wherever a system efficiently distributes or collects something — veins carry blood, rivers carry water, neurons carry signals, trees carry light. These are not metaphors borrowed from nature for aesthetic reasons. They are the same underlying structure. A conversation tree and a river delta obey the same logic:

- There is a **source** — the original question, the rainfall upstream
- There is **flow** — context moving forward through the thread
- There are **splits** — where one stream of thought becomes two
- There are **tributaries** — where two streams merge and carry both forward
- There are **dead ends** — water that soaks into the ground, question answered, done
- There is a **shape** — the whole thing viewed from above tells you something about the terrain it flowed through

### The canvas is the terrain

No auto-layout exists in this product. This is not an oversight — it is the philosophically correct decision. In all natural branching systems, structure emerges from local decisions at each point. A root splits because it hit a rock. A neuron connects because it fired alongside another. Thought doesn't have a layout engine. The canvas is freeform because thinking is freeform.

### Context is spatial

People have an inexplicable spatial orientation to the knowledge they are gathering. The knowledge currently in working memory has a felt location. This product attempts to replicate that — to give the invisible architecture of a thinking session a visible, navigable form.

### The LLM as thinking partner

The goal is not a faster way to get answers. It is an environment that supports the full shape of inquiry — including branching, parallel exploration, dead ends, and convergence. The LLM is a participant in that process, not just a query endpoint.

### Governing principles

These principles are the decision filter. When a new feature or design question arises, it should be checked against these before proceeding.

1. **Spatial autonomy is inviolable.** The user controls where everything lives. No auto-layout, no auto-arrangement, no suggestions about positioning. Ever.
2. **Context is everything.** Every card in a branch must carry the full context of its ancestors. Never drop context silently.
3. **Flow over friction.** The fastest path to a new thought is a single keystroke (Q). No menus, no modals, no confirmation dialogs for common actions.
4. **Visual fidelity to thought.** Curves over lines. Colour for lineage. Compression for scale. The interface should look like thinking, not like a database.
5. **Trust through transparency.** API keys never leave the browser. No backend, no logging, no data collection in V1. Developers can verify this by inspecting network traffic.
6. **Scope discipline.** Features are built for the current version only. V2 ideas are noted and frozen — they do not creep into V1.

---

## 3. User Stories

These are the user stories that V1 must satisfy. Each has a clear actor, action, and outcome.

### Canvas

**US-01** — As a user, I want to open the product to a blank canvas with a single input in the centre, so that I can start thinking immediately without navigating any chrome.

**US-02** — As a user, I want to pan the canvas freely by clicking and dragging on empty space, so that I can navigate to any area of my session.

**US-03** — As a user, I want to zoom in and out smoothly with my mouse wheel or trackpad pinch, so that I can change my level of detail without losing orientation.

### Cards

**US-04** — As a user, I want to press Q anywhere on the canvas to drop a question card at my cursor position, so that I can capture a thought the moment it arises without moving my hands to a toolbar.

**US-05** — As a user, I want to type a question into a card and hit Enter to trigger a response, so that asking a question feels as fast as possible.

**US-06** — As a user, I want to see three sequential loading states before the answer appears, so that I know the model is working.

**US-07** — As a user, I want the answer to stream in word by word, so that I can start reading before the response is complete.

**US-08** — As a user, I want a follow-up input at the bottom of every answered card, so that I can continue the thread from any point without any extra steps.

### Branching

**US-09** — As a user, I want to drag from the edge of any card to create a new branch, so that I can start a parallel line of inquiry from any point in my session.

**US-10** — As a user, I want branches to be connected by smooth bezier curves in the thread's accent colour, so that the visual relationship between cards feels like flow rather than a diagram.

**US-11** — As a user, I want each root thread to have its own accent colour that all its children inherit, so that I can visually distinguish parallel lines of inquiry at a glance.

**US-12** — As a user, I want to be able to leave a branch as a dead end when I'm done with it, so that I don't need to reconnect or close anything — satisfied threads can simply stop.

### Onboarding

**US-13** — As a developer, I want to paste my Anthropic API key into a single input on the landing page and click one button to open the canvas, so that I can get started without creating an account or going through any other setup.

**US-14** — As a returning user, I want to land directly on my canvas without seeing the onboarding screen again, so that I can continue where I left off immediately.

---

## 4. Out of Scope

The following are explicitly not being built in V1. They are noted here to prevent scope creep and to signal where the product will go.

**Not in V1:**
- Multi-session management (navigating between past sessions)
- Live LLM integration (V1 uses a dummy response system)
- File attachment and preview
- Thread merge (two branches converging with shared context)
- Branch suggestion chips from the LLM
- LOD zoom rendering with AI-generated thread summaries
- Minimap navigation
- Answer-only as the atomic unit (instead of Q+A pair)
- Collapsible branch threads
- Curve collision avoidance
- Mobile or touch-first interactions
- OpenAI or Gemini support (Claude only, and even that is V2 — V1 is dummy)
- Any backend, database, or server infrastructure
- User accounts or authentication

---

## 5. Decisions & Design Rationale

### Canvas

| Decision | Rationale | Decided By |
|---|---|---|
| Infinite canvas as the base metaphor | Reflects how thinking occupies mental space without fixed boundaries | Prem |
| No auto-layout, ever | Spatial autonomy is core to the product philosophy — the user positions everything | Prem |
| Freeform card placement | Mirrors the freeform nature of thought | Prem |
| FigJam as the reference point for interaction feel | Simple, fluid, low-friction spatial tool that non-technical users understand immediately | Prem |
| Smooth bezier curves for connections, not straight lines | Straight lines feel mechanical like flowcharts; curves feel like flow | Prem |
| Dot grid or subtle pattern as background | Provides spatial reference without visual noise | Prem |

### Cards

| Decision | Rationale | Decided By |
|---|---|---|
| Q+A pair as the atomic unit (V1) | Keeps the visual unit coherent — one exchange, one card | Prem |
| Answer-only as the atom (future exploration) | More flexible but more complex; deferred to later version | Prem |
| Follow-up input lives at the bottom of each card | Thread grows downward naturally from the card | Prem |
| File attachment badge as circle icon top-right of card | Unobtrusive, clearly associated with the card, tappable to preview | Prem |
| Three loading states before answer streams in | Communicates that the model is working, not frozen | Prem |
| Answer streams in word by word | Feels alive; matches expectation from other AI products | Prem |

### Branching

| Decision | Rationale | Decided By |
|---|---|---|
| Branches are created by dragging from a card edge | Direct manipulation; no toolbar needed | Prem |
| Each root thread gets an accent colour | Visual differentiation of parallel lines of inquiry | Prem |
| All child cards inherit the parent thread's accent colour | Colour signals lineage and context at a glance | Prem |
| Connecting curves inherit the thread accent colour | Visual continuity from card to curve to card | Prem |
| Not all branches need to return to parent | Some tangents are simply answered and closed — this is valid and natural | Prem |
| Three branch endings: dead end, merge, ongoing parallel | Models the three real outcomes of a line of inquiry | Prem |

### Sessions

| Decision | Rationale | Decided By |
|---|---|---|
| V1 solves for a single session | The hard problem of multi-session navigation is deferred; single session has enough complexity | Prem |
| A question dropped on blank canvas without connection is its own root thread | Equivalent to starting a new chat in current tools, but spatially situated | Prem |
| Connecting to existing world (multi-session) is deferred | Not in scope for V1 | Prem |
| Canvas state persisted in localStorage | No backend needed; sufficient for single-session use; key never leaves the browser | Prem |

### Zoom & Navigation

| Decision | Rationale | Decided By |
|---|---|---|
| Fluid zoom in/out (mouse wheel + pinch) | Core canvas behaviour; must feel smooth not stepped | Prem |
| LOD (Level of Detail) rendering is a V3 feature | Cards compress and eventually show AI-generated thread summary at far zoom; noted but deferred | Prem |
| No minimap in V1 | Adds complexity; single session canvas is navigable without it | Prem |

### Shortcuts

| Decision | Rationale | Decided By |
|---|---|---|
| Press Q anywhere on canvas to drop a question card at that point | Fast capture of a thought at the moment it arises; spatial — it drops where your cursor is | Prem |

### V1 Build & Implementation

Decisions taken during planning and build sequencing for V1. Updated as new decisions land.

| Decision | Rationale | Decided By |
|---|---|---|
| V1 is built in 5 incremental, individually-testable steps (single card → follow-ups → Q shortcut + colours → drag & branch → onboarding + persistence) | Allows validation of each capability before stacking the next; matches the "simple executable steps" preference | Prem (staged approach), AI (specific 5-step breakdown) |
| Test locally first; deploy to Vercel only at the end of V1 | Avoid premature deployment overhead during iteration | Prem |
| Onboarding (API key landing page) deferred to the final step; Steps 1–4 open straight into the canvas | Lets early steps be tested without a real Anthropic key; lower friction during build | AI |
| Use Zustand for client-side state management | Lightweight, minimal boilerplate; fits a client-only architecture without pulling in Redux-class tooling | AI |
| Use a custom canvas component (not `react-flow` or a third-party canvas library) for V1 | Aligns with the spec preference; keeps bundle lean and gives full control over pan/zoom/curve rendering | AI (committing to the option already favoured by Prem in spec section 9) |
| Use an 8-colour placeholder palette for thread accents until OQ-01 is resolved; cycle after 8 threads. Colours: `#7C9EFF, #FF8FA3, #6FCF97, #F2C94C, #BB6BD9, #56CCF2, #F2994A, #9B51E0` | Need usable defaults so the build can proceed; trivial to swap once final palette is provided | AI |
| Render thread accent on each card as a thin (3px) right-rounded vertical bar flush with the card's left edge, slightly inset top/bottom; not as a full coloured border | "Subtle left border or top accent" was specced as either-or; the inset bar reads as a lineage marker without fighting the card's rounded corners | AI |
| When Q is pressed, the new card is placed with its top-center near the cursor: `x = worldX - CARD_WIDTH/2`, `y = worldY - 30` | Puts the question textarea right under the cursor so typing starts immediately at the gaze point | AI |
| Q shortcut is ignored when the user is typing in an `INPUT`/`TEXTAREA`/contenteditable, or when any modifier key (Ctrl/Cmd/Alt) is held | Avoid hijacking the letter Q during normal text entry or chorded shortcuts | AI |
| Q is a two-step placement: press Q -> a ghost preview card attaches to the cursor; a single click anywhere anchors it to the canvas at that position; Esc cancels and the ghost disappears | Gives the user a deliberate preview-and-confirm beat instead of an immediate drop — they can see exactly where the card will land before committing | Prem |
| While in Q placement mode, normal canvas pan is suppressed and the cursor switches to `crosshair`; the click that anchors the card is consumed (capture-phase `pointerdown`) so it never focuses underlying textareas or starts a pan | Click must mean "place card", nothing else; otherwise a click landing on top of an existing card or on canvas would have ambiguous intent | AI |
| Only root cards (`parentCardId === null`) are draggable; child cards are never individually movable. Dragging a root moves the entire subtree (root + every descendant) rigidly, with relative offsets preserved | A thread is a single thought-shape — children shouldn't drift away from their parent. Keeping movement at the root level preserves the spatial integrity of the thread and matches how a thinker would reposition "this whole line of inquiry" as one unit | Prem |
| Drag activates on a pointer-down anywhere on a root card that is NOT an interactive descendant (`textarea`, `button`, `input`, contenteditable). Pointer capture is taken on the card div so the drag survives fast cursor movement outside the card | Largest possible drag target without trampling text entry or button clicks; pointer capture eliminates the common "card snaps back" bug when the cursor outpaces the drag | AI |
| Drag deltas are converted from screen space to world space by dividing by `viewport.scale` before applying via `moveSubtree(rootId, dx, dy)` | Without scale compensation, dragging at low zoom would lag the cursor; at high zoom it would race ahead | AI |
| Each pulled branch creates a NEW thread with the next palette colour and is draggable as a root in its own right (resolves OQ-04) | "Pull a new thread" semantically means a new thread; new colour reinforces the parallel-inquiry mental model | Prem |
| Hovering any card reveals two circular `+` handles at its left and right edge midpoints (half-overlapping the card edge). A single click on either immediately spawns a branch card on that side | Direct manipulation: branching is a one-action affordance with no menus or modals | Prem |
| Branch card placeholder text is `"Pull a new thread"` (initial roots and follow-ups keep `"ask anything"`) | Communicates intent in-place — the user knows this card is the start of a separate line of inquiry | Prem |
| Branch is placed at `parent.bottom + 80px` (same Y as a follow-up would be), offset one card-width + 40px to the chosen side. Multiple branches on the same side cascade further out at the same Y | Keeps the visual rule "follow-up and branch share the horizontal level" cleanly satisfied; cascading horizontally rather than stacking down avoids collisions with future follow-ups beneath the source | Prem |
| Existing follow-up hide rule unchanged: any descendant (follow-up OR branch) hides the follow-up input on a card | Confirmed; keeps the rule simple and predictable. To continue a thread after branching, branch first then add a follow-up to the new card | Prem |
| Connection now carries `fromSide`/`toSide` metadata; renderer chooses horizontal-tangent bezier for side anchors and vertical-tangent for top/bottom anchors | Different lineage shapes deserve different curve shapes — vertical for "continuing this thought", horizontal for "spinning off a new thought" (matches the Blender-nodes reference image style) | AI |
| Curve stroke colour resolves from the SOURCE card's thread accent (not the target's). So a branch curve emerges from the source's colour and arrives at a card whose own accent is a different colour | The connection visually represents "this thought came from over there"; reading the source colour at the source end keeps the lineage legible | AI |
| Do not preemptively add a CORS workaround header (`anthropic-dangerous-direct-browser-access: true`) for the browser → Anthropic validation call; add only if a deployed call actually fails | Avoid speculative code complexity; address only on real failure | Prem |
| Maintain a "Decided By" column on every decision table in this spec, tagging each entry as AI or Prem | Clear provenance of every decision as the spec evolves and more decisions get layered in | Prem |
| Opt-in auto-layout via right-click context menu ("Auto layout canvas") | Philosophical default remains no auto-layout; user explicitly requests column rearrangement when overlap becomes unwieldy. Depth-first columns: independent roots sorted by Y, follow-ups stack vertically, lateral branches occupy the next column(s) to the right | Prem |

---

## 6. User Interface Specification

### Entry Point

- Product opens to a **blank canvas**
- A single **search/question input** is centred on the canvas on first load
- No sidebar, no list, no navigation chrome
- The input is the entire interface until the first question is asked

### Canvas

- Infinite in all directions
- Pan with click-drag on empty canvas area
- Zoom with mouse wheel or trackpad pinch
- Background: subtle dot grid pattern
- No grid snapping
- No auto-arrangement of cards at any point

### Q&A Card Anatomy

```
┌─────────────────────────────────────┐  ◯ (file badge, top-right outside card)
│  Q: [Question text]                 │
│─────────────────────────────────────│
│  [Answer streams in here]           │
│  [Loading states shown here]        │
│                                     │
│─────────────────────────────────────│
│  Ask a follow-up...          [Send] │
└─────────────────────────────────────┘
```

- Card has a subtle left border or top accent in the thread colour
- Card is resizable (future; V1 can be fixed width)
- File badge: circle icon, top-right, outside the card boundary, visible only when a file is attached

### Loading States (in sequence)

1. "Thinking..." — with a subtle pulse animation
2. "Gathering context..." — same pulse
3. Answer begins streaming word by word

### Connecting Curves

- Smooth bezier curves, not straight lines
- Originate from the bottom or side edge of the parent card
- Terminate at the top edge of the child card
- Colour matches the thread accent colour
- No arrowhead in V1 (direction implied by card layout)
- User positions cards freely; curves follow

### Branch Accent Colours

- Each root thread is assigned an accent colour at creation
- All descendant cards inherit that colour
- Curves in that thread match the colour
- Specific palette and assignment logic to be defined with visual references (deferred)

### File Preview

- Tapping the file badge opens a preview overlay
- Supported types to be defined; MD files and documents are the primary use case
- Preview is modal, closeable

### Q Shortcut

- Pressing Q on the keyboard drops a new blank Q&A card at the current cursor position on the canvas
- Card immediately focuses its question input
- If the card is not connected to any existing card, it becomes a new root thread

---

## 7. Interaction Model

### Starting a Thread

1. Press Q or click the initial search box
2. A card appears at cursor position
3. Type question, hit Enter
4. Loading states play
5. Answer streams in
6. Follow-up input appears at bottom of card

### Continuing a Thread

1. Type in the follow-up input at the bottom of any card
2. A new card appears below, connected by a curve
3. Same loading and streaming behaviour
4. Thread grows downward

### Creating a Branch

1. Drag from the edge of any card
2. A new card is created
3. A bezier curve connects the parent card to the new card
4. The new card inherits the thread accent colour
5. All context from the parent card and its ancestors flows into this branch

### Branch Endings

- **Dead end (complete):** Thread simply stops. The last card has no follow-up. This is a valid and natural state.
- **Merge (future V2):** Two threads converge. Context of both flows forward. Visual shows two curves entering one card.
- **Ongoing parallel:** Branch keeps growing independently alongside the main thread

### Parallel Threads

- Multiple root threads can exist on the same canvas simultaneously
- Each has its own accent colour
- They are visually and contextually independent unless merged
- The user positions them spatially wherever feels right

### Context Inheritance

- Every card in a branch carries the full context of all ancestor cards
- When a branch is created from a card, the new branch begins with that full upstream context
- Merged threads (V2) will carry context from both upstream paths

---

## 8. Version Roadmap

### V1 — Core Canvas (current build target)

- Infinite freeform canvas with pan and zoom
- Q+A card as atomic unit
- Dummy LLM with three loading states and randomised placeholder responses
- Q shortcut to drop card at cursor
- Follow-up input on each card
- Drag-to-branch with bezier curve connector
- Thread accent colour system
- File badge placeholder (non-functional UI only)
- Developer onboarding with API key input
- Canvas state persisted in localStorage

### V2 — Intelligence Layer

- Live LLM integration (Claude first, OpenAI and Gemini later)
- File attachment support with preview
- Thread merge — two branches converge, context combines
- Branch suggestion chips at end of each response (LLM suggests parallel or connected branches)
- Mark branch as done (visual closed state on terminal card)
- Multi-session persistence

### V3 — Scale & Navigation

- LOD zoom rendering — cards compress at mid zoom, show AI thread summary at far zoom
- Summary generated lazily on first zoom-out to that level
- Minimap for large canvases
- Tag or cluster system for navigating many threads
- Connect to existing chat history from other tools

### Noted but Unscheduled

- Answer-only as the atomic unit (instead of Q+A pair)
- Collapsible branch threads (fold into root card)
- Soft collision avoidance on curves (curves path around cards)
- Mobile / touch-first canvas interactions

---

## 9. Technical Implementation

### Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | Next.js | Existing comfort zone; fast to ship |
| Hosting | Vercel | Seamless with Next.js |
| Database | None (V1) | Everything in localStorage |
| Backend | None (V1) | Direct browser-to-API calls |
| Styling | Tailwind | Utility-first; fast iteration |

### Canvas Implementation

- Canvas rendered with a custom React component, not a third-party canvas library (keeps bundle lean and control maximal for V1)
- Alternatively: `react-flow` or a lightweight wrapper around HTML canvas — to be evaluated at build time
- Pan: track pointer delta on mousedown/mousemove on canvas background
- Zoom: transform scale applied to a container div; use CSS `transform: scale()` with `transform-origin: center`
- Cards are absolutely positioned divs within the canvas container
- Card positions stored as `{ id, x, y }` in state

### Bezier Curve Rendering

- Curves rendered on an SVG layer that sits behind the cards
- Each curve is a `<path>` element with a cubic bezier (`C` command)
- Control points calculated from the relative positions of source and target cards
- Curves update reactively when cards are moved

### Dummy LLM (V1)

- No external API call
- On question submit: sequence through three loading states with setTimeout delays
- Generate a randomised multi-sentence placeholder response from a pool of sentence fragments
- Response streams in word by word using a setInterval that appends one word at a time to state

### State Shape (simplified)

```javascript
{
  threads: [
    {
      id: "thread_1",
      accentColour: "#7C9EFF",
      cards: [
        {
          id: "card_1",
          threadId: "thread_1",
          question: "How does inflation work?",
          answer: "...",
          position: { x: 200, y: 150 },
          parentCardId: null,
          childCardIds: ["card_2", "card_3"]
        }
      ]
    }
  ],
  connections: [
    { from: "card_1", to: "card_2" },
    { from: "card_1", to: "card_3" }
  ]
}
```

### localStorage Persistence

- Full canvas state serialised to localStorage on every meaningful change
- Restored on page load
- API key stored separately in localStorage, never sent to any server other than the LLM provider directly

---

## 10. API Handling

### V1 Philosophy

All LLM API calls are made directly from the browser. No proxy server. No backend. The user's API key is stored in localStorage and passed directly in the Authorization header of each request. This means:

- Zero infrastructure cost
- Zero data exposure risk to the product operator
- Developer users can inspect network calls and verify their key is not being misused
- Works immediately with no auth system

### Supported Providers (V1)

- **Claude (Anthropic)** — primary and only V1 target
- OpenAI and Gemini — deferred to V2

### Claude API Call Shape

```javascript
const response = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: {
    "x-api-key": userApiKey,
    "anthropic-version": "2023-06-01",
    "content-type": "application/json"
  },
  body: JSON.stringify({
    model: "claude-opus-4-5",
    max_tokens: 2048,
    system: systemPrompt,
    messages: conversationHistory
  })
});
```

### Context Construction

When a card sends a question, the messages array passed to the API is constructed from all ancestor cards in the branch, in order:

```javascript
[
  { role: "user", content: "root question" },
  { role: "assistant", content: "root answer" },
  { role: "user", content: "follow-up question" },
  { role: "assistant", content: "follow-up answer" },
  { role: "user", content: "current question" }
]
```

This ensures every card in a branch has full upstream context without the user doing anything manually.

### System Prompt

The system prompt should inform the model that it is operating inside a branching spatial canvas for exploratory thinking, not a standard chat interface. This affects tone and the eventual branch suggestion feature.

### Streaming

- Claude API supports streaming via SSE
- V1 can use non-streaming for simplicity, simulating streaming word-by-word on the frontend
- V2 should implement true SSE streaming for responsiveness

### API Key Handling Rules

- Key stored in localStorage only
- Never logged
- Never sent to any server other than api.anthropic.com
- Cleared on explicit user action (settings panel, V2)
- Input field type=password on the onboarding screen

---

## 11. Onboarding

### Target User

Developers with an existing Anthropic API key. Comfort with API keys as a concept. No hand-holding needed.

### Flow

```
Landing page
    ↓
Single headline explaining the product in one sentence
    ↓
API key input field (type=password)
    ↓
"Open Canvas" button
    ↓
Key saved to localStorage
    ↓
Canvas opens — blank, ready
```

### Returning User

- Key already in localStorage
- Land directly on canvas
- No onboarding screen

### Landing Page Content

- One sentence: what it is
- One sentence: how it works (paste your key, think spatially)
- Key input
- No marketing copy, no feature list, no screenshots in V1

### Key Validation

- On submit, make a minimal test call to the Anthropic API (e.g. a short completion)
- If it fails, show inline error: "Key didn't work — check and try again"
- If it succeeds, proceed to canvas

---

## 12. Open Questions

These are decisions not yet made. They are logged here so they are not forgotten or resolved prematurely.

| # | Question | Context | Priority |
|---|---|---|---|
| OQ-01 | What is the exact accent colour palette for threads? | User mentioned colours will be provided via visual references later. Palette size (how many colours before cycling?) also undecided. | High — needed before first visual polish pass |
| OQ-02 | What is the exact curve tension and bezier style? | User mentioned they will provide visual references for curve smoothness. FigJam-style vs tighter bezier TBD. | High — needed before Checkpoint 5 |
| OQ-03 | Does the connecting curve originate from a specific drag point on the card, or from the nearest edge automatically? | Affects both interaction model and SVG rendering logic. | High — needed before Checkpoint 5 |
| OQ-04 | Does a branch card created via drag inherit the parent's thread colour, or does the user assign it a new colour to start a new thread? | **Resolved (V1):** each branch starts a NEW thread with the next palette colour. The branch root is independently draggable; dragging the source still pulls connected branches along via the connections graph. See the V1 Build & Implementation section. | Resolved |
| OQ-05 | What placeholder text should the dummy LLM return? | Specified as "meaningful-sounding English gibberish" but the actual sentence pool needs to be written. | Low — easy to address at build time |
| OQ-06 | Should the canvas state persist across browser sessions in V1? | Currently specced as yes via localStorage. But if the canvas grows large, localStorage may hit size limits. Worth validating the approach. | Medium |
| OQ-07 | What is the product name? | "Delta" was proposed as a working name based on the river delta metaphor. Not confirmed by the product owner. | Low — can be deferred until pre-launch |

---

## 13. Acceptance Checklist

This checklist validates that V1 is complete and ready. All items must pass before V1 is considered shippable.

### Canvas
- [ ] Blank canvas renders on load with no UI chrome other than the initial question input
- [ ] Pan works smoothly in all directions via click-drag on empty canvas
- [ ] Zoom in and out works smoothly via mouse wheel and trackpad pinch
- [ ] No auto-layout occurs at any point under any condition
- [ ] Cards remain in their user-placed positions after zoom and pan

### Cards & Responses
- [ ] Pressing Q drops a blank question card at the cursor's current canvas position
- [ ] The question input is immediately focused when the card drops
- [ ] Hitting Enter on a question triggers the response flow
- [ ] Three sequential loading states appear before the answer
- [ ] The answer streams in word by word
- [ ] A follow-up input is visible at the bottom of every answered card

### Branching
- [ ] Dragging from a card edge creates a new connected card
- [ ] The connecting curve is a smooth bezier, not a straight line
- [ ] The curve colour matches the thread accent colour
- [ ] All cards in a branch share the same accent colour as the root
- [ ] A branch with no follow-up (dead end) requires no closing action — it simply stops

### Onboarding
- [ ] Landing page has a single API key input and one CTA button
- [ ] A valid key passes validation and opens the canvas
- [ ] An invalid key shows an inline error without navigating away
- [ ] A returning user with a stored key lands directly on the canvas
- [ ] The API key is never visible in network calls to any domain other than api.anthropic.com

### State
- [ ] Canvas state (card positions, questions, answers, thread colours) survives a page reload

---

*This document reflects all decisions and inputs from the initial brainstorming session. Sections on user stories, out of scope, open questions, and acceptance checklist were added based on spec-driven development best practices. No product decisions have been invented or altered.*
