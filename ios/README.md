# Flowstate iOS (V1)

Native SwiftUI app focused on **sharing and viewing** your Flowstate artifacts.
Read-only V1: sign in, browse canvases, swipe full-screen through artifacts,
interact with them, and share/copy. Creating artifacts and token usage are out
of scope. Part of the single Flowstate codebase (web + Mac + iOS).

## Design contract (important)

- **Apple Liquid Glass is applied to floating control chrome ONLY** — the feed's
  top bar, the bottom share/copy/page dock, and the tab bar. See
  `Glass/GlassChrome.swift` (real `.glassEffect` on iOS 26, `.ultraThinMaterial`
  fallback below).
- **Artifacts and list pages render identically to the web app.** Glass never
  touches artifact content.

## Architecture

| Layer | Files |
|---|---|
| App shell | `App/` — `FlowstateApp`, `RootView`, `AppEnvironment` |
| Auth (Supabase, reused) | `Auth/` — `SupabaseManager`, `AuthViewModel`, `SignInView` |
| Data | `Models/` (`JSONValue`, `Artifact`, `Canvas`), `Data/` (`CanvasRepository`, `CanvasSnapshotParser`) |
| Navigation | `Features/MainTabView` → `Canvases/`, `Links/`, `Profile/` |
| Feed | `Features/Feed/` — paged-snap vertical full-screen feed + glass chrome |
| Rendering (hybrid) | `Rendering/ArtifactRenderView` → `Native/` (table, todo, stickynote, calendar) + `Web/` (WKWebView) |

### Hybrid rendering
- **Native SwiftUI**: `table`, `todo`, `stickynote`, `calendar`.
- **WKWebView**:
  - `custom` → local srcdoc via `CustomSrcdoc` (Swift port of `lib/customArtifact.ts`).
    Fully interactive (touch + keyboard), no network.
  - all other complex/interactive kinds → the web viewer route
    `app/m/artifact/[canvasId]/[artifactId]` (reuses `<ArtifactContent>` for exact
    web parity), authenticated with the Supabase token via URL fragment.
- **Excluded in V1**: `3d`, `audio` (see `ArtifactKind.isSupportedInV1`).

### Data flow
Supabase (direct, RLS) → `canvases.state` JSONB → `CanvasSnapshotParser` →
ordered `[Artifact]` (questions excluded; links split into the Links tab).

## Setup

Requires **full Xcode** (not just Command Line Tools) and
[XcodeGen](https://github.com/yonaskolb/XcodeGen).

```bash
brew install xcodegen
cd ios
cp Config/Secrets.example.xcconfig Config/Secrets.xcconfig
# Edit Config/Secrets.xcconfig — fill in SUPABASE_HOST, SUPABASE_ANON_KEY,
# WEB_HOST (deployed web app host). These mirror the web NEXT_PUBLIC_SUPABASE_* vars.
xcodegen generate
open FlowstateMobile.xcodeproj
# Select an iOS 26 simulator for true Liquid Glass; iOS 17+ runs with the
# material fallback. Build & run (⌘R).
```

### Supabase OAuth redirect
Add `flowstate://auth-callback` (the `OAUTH_REDIRECT_SCHEME`) to your Supabase
project's allowed redirect URLs for Google sign-in to return to the app.

## Status / TODO
- [x] App shell, auth, data layer, navigation, paged feed + glass chrome
- [x] Native renderers: table, todo, stickynote, calendar
- [x] WebView renderers: custom (local) + web-viewer route for complex kinds
- [ ] Build/run verification (needs full Xcode — not available in the scaffolding env)
- [ ] Gesture tuning where inner WebView scroll meets the outer paging scroll
- [ ] App icon + launch assets
- [ ] Artifact-level search (V1 ships canvas-title search)
