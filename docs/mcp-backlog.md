# MCP — planned, delivered, pending

Status of the Model Context Protocol build on `phase5-stdio-mcp-add`.
Last updated 2026-09-09.

---

## At a glance

| | |
|---|---|
| **Delivered** | Phases 1–5 + 3 fix commits. MCP works: HTTP and local (stdio) servers, approvals, OAuth, tool results on canvas |
| **In flight** | B0 login-shell PATH capture — written and verified, **uncommitted** |
| **Unpushed** | 2 commits (`b213bdc`, `6f692e8`) ahead of `origin/phase5-stdio-mcp-add` |
| **Pending** | 2 × P0 bugs (~1 day), P1 protocol coverage (~1 day), then terminal / resources / notifications / tasks |

**Production web is unaffected by everything below.** `isStdioMcpAllowed()` is
`isDesktopApp() || NODE_ENV === "development"`, so on a Vercel deploy stdio is
refused at all four enforcement points. The open desktop issues are Mac-app
shipping issues only.

---

## Delivered

### Phases 1–4 — remote (HTTP) MCP · `ec9e714` + follow-ups

- **Core** — SSRF URL guard (https-only, private-IP blocking, redirect
  re-validation), 64-char tool-name namespacing (`mcp__{server}__{tool}`),
  Streamable HTTP client with SSE fallback and a per-instance warm pool,
  DB-cached tool lists (10-min TTL, stale-while-revalidate) so chat requests
  never connect at prompt-build time
- **Approvals** — first-use per tool, Allow once / Always / Deny, 75s timeout =
  deny. "Always" grants keyed to a sha256 of the tool definition, so a server
  that changes a tool invalidates its own grant (rug-pull protection)
- **Auth** — OAuth 2.1 (discovery, dynamic client registration, PKCE, refresh),
  state persisted encrypted so the start/callback pair survives instance hops.
  Header/API-key auth AES-256-GCM encrypted
- **UI** — MCP tab in the right panel, registry search, paste URL/JSON, grant
  badges, enable/disable/delete. Sign-in required; guests see none of it
- **Output** — HTML tool results render as sandboxed custom-UI artifacts; tool
  descriptions and outputs framed as untrusted data in the system prompt
- **DB** — `mcp_servers`, `mcp_oauth_connections`, `mcp_tool_grants`,
  `mcp_approval_requests`, all owner-only RLS. **Applied to Supabase.**

### Phase 5 — local (stdio) servers · `cb4c1a2`

Command-based servers (`npx -y @modelcontextprotocol/server-everything`) that
spawn a process, gated to the Electron desktop build and local dev — never a
hosted web build, where spawning user-supplied commands would be RCE. Enforced
at four layers: the spawn, the tool-cache query, the create route, and the UI.
Env vars AES-encrypted. Migration `20260720120000_mcp_stdio.sql` **applied**.

### Fix commits

| Commit | What |
|---|---|
| `afecff6` | **Turn-limit exhaustion.** `maxToolTurns` was 8; reflective tools (sequential thinking) call themselves once per step and consumed every turn before the model wrote an answer. Confirmed in telemetry: three turns, `tool_turns: 8`, `outcome: success`, yet the card showed failure. Raised to 24 and made exhaustion report itself instead of surfacing as a fake "connection timed out". Also made the Local-command tab desktop-only via an Electron user-agent check, since the build-time flag cannot tell the dev browser from the dev Electron window |
| `b213bdc` | **stdio connect.** The MCP SDK applies its *own* 60s timeout to `initialize`, so raising our wrapper alone did nothing — the inner one fired first. Threaded the budget into `connect()`, raised to 180s for cold `npx` downloads (measured 53 MB / ~34s), and piped stderr into the error instead of discarding it |
| `6f692e8` | **`build_custom_ui`.** The model can hand an MCP result to the custom-UI builder; a follow-up card runs the build on its own 5-minute budget. Data travels as a first-class `sourceData` field, not appended to the question — MCP output is untrusted and appending would splice it under a heading reading "User request:" |

---

## In flight — B0, uncommitted

**Login-shell PATH capture.** A Finder-launched `.app` inherits launchd's
`PATH=/usr/bin:/bin:/usr/sbin:/sbin`. Homebrew and nvm are not on it, so `npx`
fails with `ENOENT` in ~6 ms. **Stdio MCP has therefore never worked in a
packaged build** — only via `electron:dev`, which inherits a terminal's PATH.

Electron main asks the user's login shell for its real PATH before starting the
embedded server, caches it for 7 days, and falls back to whichever of
`/opt/homebrew/bin`, `/usr/local/bin`, `~/.local/bin`, `~/.nvm/.../bin` exist.

Files: `electron/loginPathParse.js`, `electron/loginPath.js`,
`electron/main.js`, `lib/mcp/client.ts`, `lib/loginPathParse.test.ts` (15 tests).

Verified from a stripped environment: cold probe 36 ms, real PATH recovered,
`npx` resolvable, warm read 0 ms.

> Testing it caught a second bug. The probe was
> `command echo "__BEGIN__$PATH__END__"` — and because the sentinels start with
> underscores, `$PATH__END__` parses as a variable *named* `PATH__END__`, which
> is empty. The probe silently failed and every user would have dropped to the
> fallback. `${PATH}` braces fix it; there is a regression test.

**Behaviour change:** stdio children now get `cwd: os.homedir()`. Previously
they inherited the server's cwd — the repo root in dev, `Resources/standalone`
in a packaged app, where relative paths pointed inside the app bundle.

---

## Pending

| P | Item | Fixes | Est. |
|---|---|---|---|
| **P0a** | Commit images → gallery artifact | "Couldn't generate" on image results | 0.5d |
| **P0b** | Portal pointer guard + card file drop | Dead `+` attach menu | 0.5d |
| **P1** | Content-block coverage | Dropped resource links, audio, blobs | 1d |
| **B1–B4** | Terminal in the Mac app | No shell or filesystem access | 4–5d |
| P2 | Resources API (`resources/list` + `read`) | Links not clickable | 3d |
| P3 | Notifications over Supabase Realtime | Logging + subscriptions silent | 1w |
| P4 | MCP tasks | `simulate-research-query` unsupported | 1–2w |

### P0a — images never become an artifact

`resolveArtifactPreviewStatus` returns `"failed"` whenever a card has images and
no `outputArtifactId`, and nothing on the image path ever sets one.
**`commitImagesArtifact` already exists with zero callers**, and the gallery
renderer `ImagesArtifactContent.tsx` is already built — they are simply not
wired together. `"images"` is also missing from the client's artifact-type
whitelist. `search_images` (Wikimedia) has the identical bug, so one fix covers
both paths.

### P0b — the `+` attach menu

Two independent halves.

**Portal pointer guard.** The menu renders into `document.body` via a React
portal. Portals bubble events through the *React* tree, not the DOM tree, so a
click reaches `Canvas.handlePointerDown`, whose `closest()` check sees a
body-mounted node as "empty canvas". It takes pointer capture — which kills the
click — and calls `clearSelection()`. The menu stays open, hovers work, nothing
responds. `QuickExplainPopup.tsx:126` and `AnswerSelectionMenu.tsx:141` both
carry the one-line `onPointerDown={(e) => e.stopPropagation()}` this menu lacks.

**Card file drop.** Dropping a file onto a card does nothing:
`useSidebarDropTarget.ts:30-36` calls `preventDefault()` + `stopPropagation()`
unconditionally, then bails on anything that is not Flowstate's internal drag
type — so the drop is swallowed before the canvas handler sees it.

### P1 — content-block coverage

`shapeCallResult` (`lib/mcpManager.ts:81-122`) handles only `text`, `image`, and
`resource.text`. **There is no `else`.** A live probe of `get-resource-links`
returned 1 text + 3 `resource_link` blocks; all three were dropped silently. The
code then reported *"The MCP tool returned no content"* — false, and the reason
the model invented links rather than admitting it got nothing. Also dropped:
`audio`, `resource.blob`, and the `structuredContent` field.

Plan: extract to a pure `lib/mcp/callResult.ts`, emit one marker line per
non-text block **in content order**, add an `else` that names the unknown type
without echoing its payload, and route `structuredContent` to the
`build_custom_ui` handoff rather than the prompt (the spec requires servers to
send the same data as text too, so appending would double tokens).

### P3/P4 — why these are architectural, not oversights

Flowstate declares `capabilities: {}` to every server, registers **zero**
notification handlers, and closes the chat SSE stream the moment the turn ends.
Server-initiated messages therefore cannot arrive or be displayed. That was a
deliberate serverless trade — the pool must never be assumed to survive. Async
delivery needs a session that outlives the request; the Supabase Realtime
channel in `useCollaboration.ts` is the intended transport when it is built.

---

## Test plan — `server-everything`

Add in the MCP tab → **Local command**:

```
name: server-everything
command: npx
args: -y @modelcontextprotocol/server-everything
```

> First add downloads ~53 MB and takes up to a minute. If it times out, run the
> command once in a terminal to warm the cache, then hit Refresh.

Legend: ✅ expected to pass · ⚠️ known-broken, records the gap · 🔒 blocked

### Setup

| # | Step | Expected |
|---|---|---|
| S1 | Sign in, open the MCP tab | Panel visible; guests see nothing |
| S2 | Local command tab present in **Electron** | ✅ visible |
| S3 | Local command tab in the **browser** at :3001 | ✅ **hidden** — desktop-only |
| S4 | Add the server | ✅ connects, **13 tools** |
| S5 | Tool names | ✅ `mcp__server-everything__*` |

### Approvals

| # | Step | Expected |
|---|---|---|
| A1 | First `echo` call | ✅ approval popup by the composer |
| A2 | Allow once, call again | ✅ popup returns — allow-once is not persisted |
| A3 | Always allow, call again | ✅ no popup; "Always allowed" badge in the tab |
| A4 | Ignore the popup 75s | ✅ auto-denies, turn ends cleanly, no hang |
| A5 | Deny | ✅ model continues without the tool, no silent retry |

### Tools — the core set

| # | Tool | Expected |
|---|---|---|
| T1 | `echo` | ✅ text round-trips |
| T2 | `get-sum` | ✅ correct arithmetic |
| T3 | `get-annotated-message` | ✅ text renders |
| T4 | `get-env` | ✅ env visible — **also confirms B0**: PATH should be the login-shell one, not launchd's four entries |
| T5 | `get-tiny-image` | ⚠️ image renders inline **but shows "Couldn't generate"** → P0a |
| T6 | `get-resource-links` (count 3) | ⚠️ **no links appear**; the model may invent them → P1 |
| T7 | `get-resource-reference` | ⚠️ likely empty — embedded resource path → P1 |
| T8 | `get-structured-content` | ⚠️ structured data not surfaced → P1 |
| T9 | `gzip-file-as-resource` | ⚠️ blob resource dropped → P1 |

### Tools — unsupported protocol areas

| # | Tool | Expected |
|---|---|---|
| T10 | `toggle-simulated-logging` | ⚠️ toggles, **no log messages ever appear** → P3 |
| T11 | `toggle-subscriber-updates` | ⚠️ same — no notification handling → P3 |
| T12 | `trigger-long-running-operation` | ⚠️ no progress updates → P3 |
| T13 | `simulate-research-query` | ⚠️ "requires a task-based execution environment" → P4 |

### `build_custom_ui` handoff — not yet exercised end to end

| # | Step | Expected |
|---|---|---|
| C1 | Ask for something interactive from a data-heavy result | Model calls `build_custom_ui`; chat card finishes fast |
| C2 | After the turn | A follow-up card appears and builds for ~45–55s |
| C3 | Result | Custom component with the real data baked in; no network calls from the iframe |
| C4 | Negative control — a step-by-step reasoning prompt | **No** handoff. If it fires, the tool description's negative list needs tightening |
| C5 | Negative control — a trivial one-value result | No handoff; prose or a small table |

### Regression — must still work

| # | Step | Expected |
|---|---|---|
| R1 | An existing HTTP server (deepwiki) | ✅ unaffected |
| R2 | Verbatim-HTML fast path | ✅ renders on the chat card, no follow-up spawn |
| R3 | Guest (signed out) | ✅ MCP routes 401, chat unaffected |
| R4 | Disable the server, ask again | ✅ tools gone from the model's list |

### Packaged-app check — the only proof of B0

| # | Step | Expected |
|---|---|---|
| P1 | `npm run dist:mac` | Builds |
| P2 | **Launch the `.dmg` from Finder**, not a terminal | App opens |
| P3 | Add the stdio server there | ✅ connects — **fails without B0** |
| P4 | `get-env` | PATH includes Homebrew/nvm |

Steps P1–P4 are the only ones that exercise the launchd PATH. Everything run via
`electron:dev` inherits a terminal's PATH and cannot detect the bug.
