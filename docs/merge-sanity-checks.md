# Merge sanity checks — `origin/main` → `phase5-stdio-mcp-add`

Gate before finalising. Merge commit `d052c7b`, pushed to
`origin/phase5-stdio-mcp-add`.

**Scope:** 137 files, +14181/−753, of which 26 are binary previews (~6 MB).
Production's work is almost entirely *additive* — transcript-import canvases,
an outreach deck, tonal style packs, 8 new artifact kinds.

---

## Automated checks — all passed

| Check | Result |
|---|---|
| Auto-merge | Clean, **zero conflicts** |
| Overlap surface | Only 3 files touched by both sides |
| MCP markers present post-merge | 7/7 confirmed in the merged tree |
| `npm test` | **932 passed, 121 files** (main brought +184) |
| `npx tsc --noEmit` | **0 non-test errors** (42 pre-existing, all `.test.ts`) |
| `npm run build` | **Succeeds**, 103 kB shared first-load |
| New dependencies | **None** |
| New migrations | **None** — nothing to apply to Supabase |
| Web app boots | ✅ home renders, identical to pre-merge |
| Mac app boots | ✅ loads, clean log |

### Why the merge risk is low

The only files both sides touched are `components/Card.tsx`,
`components/chat/QnaThreadMessages.tsx` and `lib/store.ts`. Main's `store.ts`
changes (+50/−5) are confined to `BranchGroup`, `CanvasArtifactNode` and two
actions near lines 3463 and 4182 — it **never touches `createFollowUp`**, where
the `build_custom_ui` carrier lives. The hunks do not interleave.

---

## Risk register

| # | Risk | Severity | Why | Covered by |
|---|---|---|---|---|
| R1 | `artifact-styles.css` restyles existing artifacts | **High** | 1184 new lines imported globally from `app/layout.tsx`. Attribute-scoped via `[data-artifact-style]`, but nothing automated verifies old artifacts are untouched | M1 |
| R2 | 8 new artifact kinds break existing rendering | Medium | `artifactTypes.ts` +167. New union members can silently miss a `switch` arm | M2 |
| R3 | Group-frame heading band shifts canvas layout | Medium | "Reserve a heading band in group frames" changes `BranchGroup` geometry on saved canvases | M3 |
| R4 | MCP regressions from the merge | Medium | Three shared files | M4 |
| R5 | 6 MB binaries in `public/` | Low | Repo now 26.55 MiB packed; slower clones and deploys. Not a correctness issue | — |
| R6 | Perf on transcript canvases | Low | Three new canvas sections, 1000+ lines each | M5 |

---

## Manual sanity checks

Run signed in, on the merged branch. **M1 and M4 are the ones that matter.**

### M1 — existing artifacts unchanged (highest risk)

Open a canvas that pre-dates this merge and confirm each artifact kind still
renders as before: table, chart, todo, calendar, timeline, code, map, custom UI.
Look specifically for changed fonts, spacing, borders or background tone. The new
CSS is attribute-scoped, so an artifact *without* `data-artifact-style` should be
untouched — verify that holds rather than assuming it.

### M2 — new artifact kinds

Ask for a sticky note and a quote. Confirm they render and do not fall through to
a generic or blank card.

### M3 — canvas groups

Open a canvas with existing groups. Confirm the new heading band does not overlap
card content or shift members. Drag a group; confirm members travel with it.

### M4 — MCP still works end to end

1. MCP tab lists servers; existing HTTP server (deepwiki) still connected
2. "Local command" tab visible in **Electron**, hidden in the **browser**
3. Add `npx -y @modelcontextprotocol/server-everything` → connects, 13 tools
4. Call `echo` → approval popup → Allow once → result returns
5. Call `get-env` → PATH shows Homebrew/nvm, **not** launchd's four entries
   (this is the login-PATH fix)
6. Full plan: `docs/mcp-backlog.md`

### M5 — performance spot-check

Open a transcript-import canvas. Pan and zoom; confirm no visible stutter. Then
compare a cold home-page load against pre-merge (roughly 12s first compile in
dev, sub-second after).

### M6 — collaboration

Open one canvas in the browser and the Mac app simultaneously. Confirm edits sync
and no console errors.

---

## Known-broken — do not log these as merge regressions

Pre-existing, tracked in `docs/mcp-backlog.md`:

- Image results show "Couldn't generate" (P0a)
- The `+` attach menu does not respond (P0b)
- `get-resource-links` shows no links (P1)
- Logging / subscriptions / tasks silent (P3, P4)

---

## Not yet exercised

`build_custom_ui` has never run end to end — it needs a signed-in session. See
C1–C5 in `docs/mcp-backlog.md`. The packaged-app PATH fix is likewise only
provable from a Finder-launched `.dmg` (P1–P4 there).
