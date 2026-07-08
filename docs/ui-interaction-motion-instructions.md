# Flowstate Interaction Checklist

> **Source of truth** for finalized UI, interaction, and motion behaviors.  
> Run through this checklist when verifying a build — not a log of requests or explorations.  
> Last synced with codebase: **2026-06-14**.

## How to use

1. Open the main app at `http://localhost:3000`.
2. Work through each section; check the box when the behavior still holds.
3. If a check fails, treat it as a **regression** — the decision below is intentional.
4. Code references point to where the behavior is enforced.

---

## 1. Click-to-activate (canvas nodes)

Unselected nodes are **inert for body interaction**; the canvas owns scroll/wheel. Selected nodes become fully interactable.

- [ ] **Wheel over unselected artifact** zooms the canvas (does not scroll inner content). `lib/canvasWheel.ts`, `lib/canvasNodeInteraction.ts`
- [ ] **Click artifact** activates it; inner scroll regions (answers, maps, tables, embeds) consume wheel only while selected. `components/CanvasArtifactNode.tsx`
- [ ] **Same rule for Q&A cards, images, assets, GIFs, skills, text labels** — nothing is body-interactive until clicked/selected (except empty composer). `components/Card.tsx`, `CanvasAssetNode.tsx`, `CanvasGifNode.tsx`, `CanvasSkillNode.tsx`
- [ ] **Empty question composer** stays interactive without an extra click (user must type immediately). `Card.tsx` — `isEmptyComposer`
- [ ] **Click outside canvas node** deselects and returns body to inert. Selection store + node handlers

---

## 2. Hover chrome (unchanged while click-to-activate)

Hover affordances work **independently** of selection — they preview interaction; click unlocks content.

- [ ] **Hover artifact** reveals container casing, version label, controls, connector plugs, and resize grips (same family as pre click-to-activate). `CanvasArtifactNode.tsx` — `data-chrome-hover`
- [ ] **Hover Q&A node** still shows connector plugs; grey **“Pull a branch”** hint appears on plug hover (Q&A only). `components/Card.tsx`
- [ ] **Hover does not steal canvas scroll** on unselected nodes — wheel still zooms. Section 1 + Section 2 together

---

## 3. Selection keeps chrome alive

- [ ] **Selected artifact**: resize handles, fill, plugs, and controls **stay visible** when the pointer leaves the node bounds (until deselected). `CanvasArtifactNode.tsx` — `chromeVisible = chromeHover || isSelected || isPermissionPreview`
- [ ] **Pointer leave** clears hover chrome only when **not** selected. Same file — `onPointerLeave`

---

## 4. Artifact spawn & chrome timing

- [ ] **Auto-spawned artifact (pop-up)**: chrome, plugs, and casing stay visible for **5 seconds**, then fade out. `hooks/useArtifactSpawnChromeReveal.ts` — `ARTIFACT_CHROME_REVEAL_MS = 5000`
- [ ] **After fade**, chrome reappears on hover with a **quick fade-in (200ms)**; fade-out uses **500ms ease-out**. `app/globals.css` — `.artifact-canvas-container-fill`
- [ ] **Container fill** is transparent at rest; inner **surface fill** always visible so naked artifacts read on any canvas background. `globals.css` + `data-naked-artifact` kinds

---

## 5. Zoom-adaptive display (“god view”)

- [ ] **Below ~52% zoom** (`ZOOM_HIDE_CHROME`): connector plugs hidden; Q&A follow-up input and image grids hidden. `lib/zoomDisplay.ts`
- [ ] **Progressive simplification**: section labels, divider, and line clamps tighten as zoom decreases (min scale 25%). `lib/zoomDisplay.ts` — `zoomLineClamp`, thresholds
- [ ] **Q&A max height** caps at 500px when fully zoomed in; internal scroll when exceeded. `CARD_QA_MAX_HEIGHT`

---

## 6. Visible affordances & resize

- [ ] **Table column resize bars** visible at rest (accent border ~75% opacity); brighten on hover, drag, and focus-visible. `app/globals.css` — `.table-col-resize-handle`
- [ ] **Artifact corners**: resize grips appear on hover or while selected; content inside scales responsively. `CanvasArtifactNode.tsx`, artifact content stages
- [ ] **Images & assets**: resize maintains **aspect ratio** (no squeeze/stretch). Asset node resize logic
- [ ] **Audio waveform width** reflects **duration ratio** (4px/s); adjacent clips of different lengths show proportional widths. `lib/audioArtifact.ts` — `WAVEFORM_PX_PER_SECOND`

---

## 7. Copy, paste & duplicate

**Copyable:** output artifacts, input artifacts, skills. **Not copyable:** Q&A card nodes.

- [ ] **⌘/Ctrl+C** copies selected artifact(s) / skill(s) including **version history** and container geometry. `lib/canvasClipboard.ts`, `components/Canvas.tsx`
- [ ] **Right-click → Copy** on copyable selection (context menu). `CanvasContextMenu.tsx`
- [ ] **⌘/Ctrl+V** pastes on any canvas with offset; works cross-session/cross-canvas. `pasteCanvasClipboardAt`
- [ ] **Alt+drag** duplicates copyable node in place of move. `copyOnDrag: e.altKey` on artifact/asset/gif/text/skill nodes
- [ ] **Q&A nodes** never appear in copy payload. `getCopyableSelectionItems` filters `artifact | skill` only

---

## 8. Drag, drop & placement

- [ ] **Drop file/link on canvas** places input artifact without **auto-opening** left or right sidebar. Panels default collapsed; no `setLeftPanelCollapsed(false)` on paste/drop. `lib/store.ts` defaults, paste handlers in `Canvas.tsx`
- [ ] **Sidebar HTML5 drag** (GIFs, sidebar tiles) uses standard drag image; toolbar artifacts use click-to-place ghost. Documented split — both land on canvas
- [ ] **Connector drag** from plug creates branch/question with attached context (artifacts, assets, skills)

---

## 9. Keyboard & pie menu

- [ ] **Q** drops question card at cursor (viewers blocked on read-only canvas with message). Canvas keyboard handler
- [ ] **Hold Z** opens radial pie menu; release/select executes action. **Not** click-triggered. `hooks/useCanvasPieMenu.ts`, `lib/canvasPieMenu.ts`
- [ ] **Sticky note**: **S** shortcut removed from keyboard; sticky remains in **pie menu only**. Pie menu config
- [ ] **⌘/Ctrl+Z** undo works for canvas strokes (pencil) and other undo-stack actions. Store undo + pencil pipeline
- [ ] **⌘/Ctrl+C / ⌘/Ctrl+V** follow platform convention (Mac/Windows). `Canvas.tsx` keydown handler

---

## 10. Thread auto-collapse (idle)

- [ ] **After 5 minutes** of thread inactivity, thread **collapses** to question-only summary. `lib/threadInactivity.ts` — `INACTIVITY_MS = 5 * 60 * 1000`
- [ ] **Does not collapse** while streaming/thinking, if already collapsed, or if root is empty with no question text. `shouldAutoCollapseThread`
- [ ] **Activity on branch** resets timer for parent thread chain. `touchThreadActivity`

---

## 11. Sidebar, panels & iconography

- [ ] **Left panel** defaults **collapsed**; shows Flowstate logo, **canvas title** (truncated), and expand chevron. `AppLeftPanel.tsx`
- [ ] **Right panel** defaults collapsed; **Artifacts / Assets / Skills** tabs when expanded. `AppRightPanel.tsx`
- [ ] **Live activity indicator** (top-right): **icon + count only** for chats and artifacts in progress — no redundant “Chats” / “Artifacts” text labels. `LiveDrakkar.tsx`
- [ ] **Panel expand** uses motion stagger (lines/tiles); respects reduced motion. `lib/motion/variants.ts`, `MotionPanel`

---

## 12. Motion system (timing)

All motion uses shared tokens — avoid one-off durations in new UI.

- [ ] **Duration tokens**: instant 100ms, fast 200ms, standard 320ms, panel 380ms, slow 480ms, deliberate 600ms. `lib/motion/tokens.ts`
- [ ] **Easing curves**: easeLight, easeMedium, easeHeavy, easeSettle (cubic-bezier). Same file
- [ ] **Pie menu**: ring 100ms; pills 240ms with 40ms clockwise stagger; exit 100ms (immediate dismiss). `pieDelays` in tokens
- [ ] **Canvas load reveal**: nodes stagger in over ~3s with slide-up. `canvasLoadDelays`
- [ ] **`prefers-reduced-motion: reduce`** disables or simplifies motion (e.g. collaborator cursor interpolation). `lib/motion/useReducedMotion.ts`

---

## 13. Collaboration

- [ ] **Remote collaborator cursors** render smoothly (interpolated movement, Figma-like). `CollaboratorCursors.tsx`
- [ ] **Cursor hidden** when off-screen or **>3s** without update. `CURSOR_TIMEOUT_MS = 3000`
- [ ] **Reduced motion** uses simpler cursor updates. Same component + `useReducedMotion`

---

## 14. Input artifacts & assets

All user-uploaded / dropped inputs share the **same hover, plug, selection, and copy** language as generated artifacts.

- [ ] **Audio (MP3/WAV/M4A/OGG/WebM)**: max **10MB**; waveform + title; time-proportional width; playback only when selected. `.cursor/rules/waveform-input-artifact.mdc`
- [ ] **Office / Google Docs preview**: iframe inert until node selected; click overlay activates. `OfficeAssetPreview.tsx`, `GoogleWorkspaceArtifactContent.tsx`
- [ ] **Assets vs artifacts toggle** on right panel separates generated artifacts from uploaded assets. `AppRightPanel.tsx` tabs
- [ ] **Attachment pills** in composer: icon + label, tight padding, Flowstate icon family. Chat composer attachment UI

---

## 15. Auto-artifact permission preview

- [ ] **Before auto-creating** map/travel/embed artifacts, permission ghost appears with Yes/No. `ArtifactPermissionPrompt`, `permissionPreview` on node
- [ ] **Yes** creates artifact; **No** dismisses with **exit animation** (motion system). `declinePermissionPreview`
- [ ] **Permission preview** keeps chrome visible and body interactable for the prompt. `contentInteractive = isSelected || isPermissionPreview`

---

## 16. Pencil & canvas drawing

- [ ] **Pencil tool** from bottom toolbar: cursor switches to draw mode; strokes on canvas layer. `CanvasBottomToolbar.tsx`, `CanvasDrawingLayer`
- [ ] **Color picker** in pencil popover (palette from `PENCIL_COLORS`). `CanvasPencilPopover.tsx`
- [ ] **⌘/Ctrl+Z** removes last stroke. Pencil undo integration
- [ ] **Strokes persist** in canvas snapshot / reload. `lib/canvasSnapshot.ts`

---

## 17. Sticky notes

- [ ] **Hover/toolbar** matches other artifacts (font scale, edit/save flow). Sticky artifact content + controls bar
- [ ] **Double-click or Edit** enters text edit; **Save** commits; **Enter** or **Done** exits edit back to **selected** artifact state. Sticky note UX
- [ ] **Dark theme** colors remain legible. Theme tokens on sticky surface

---

## 18. Export & artifact actions

- [ ] **Export menu** on artifacts: image screenshot, format-specific exports (CSV, code copy icon, etc.). `ArtifactExportMenu.tsx`
- [ ] **Copy as code** (HTML/React where relevant) via icon-only control. `ArtifactCopyCodeButton.tsx`
- [ ] **Selectable text** in table/todo artifacts opens quick actions (Quick answer, Ask question, Add to canvas). Text selection menu

---

## 19. Groups (multi-select)

- [ ] **Multi-select + Group** creates named bounding group (default **“Untitled Group”**). `createGroupFromSelection` in `lib/store.ts`
- [ ] **Group plug** pulls connector with combined context from grouped items. Group connector behavior
- [ ] **Align toolbar** appears for 2+ selected items (icon-only align buttons). `SelectionToolbar.tsx`

---

## 20. Sound (ambient feedback)

- [ ] **CanvasSoundBridge** mounted globally; interactions map to sound presets where configured. `components/CanvasSoundBridge.tsx`, `lib/sounds/`
- [ ] **Mute control** stays accessible; hides behind left panel when panel expands. Mute button + panel z-index

---

## Regression guardrails

When changing canvas, artifact, or motion code, re-verify at minimum:

1. Sections **1–3** (click-to-activate + hover + selection chrome)  
2. Section **7** (copy scope)  
3. Section **8** (sidebar discipline on drop/paste)  
4. Section **10** (idle collapse)  
5. Section **12** (motion tokens — no stray `transition: all 300ms` without token)

---

## Refreshing this document

This checklist is **curated**, not auto-generated from chat logs. Update it only when a behavior is **finalized and merged** — not for bugs, explorations, or open questions.

To re-scan chats for *candidate* changes (not for publication as-is):

```bash
npm run ui-instructions:compile
```

View this checklist at **http://localhost:3070** (`npm run dev:ui-instructions`).
