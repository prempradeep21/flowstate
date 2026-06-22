import SwiftUI

/// Full-screen artifact viewer. Shows ONE artifact at a time so the WebView
/// receives all touch/keyboard input (no outer scroll competing with the
/// content). Move between artifacts with the ▲/▼ arrows in the glass dock.
/// Only the top bar and dock are Liquid Glass; artifact content is web-identical.
struct ArtifactFeedView: View {
    private let feedTitle: String
    private let canvasId: String?
    private let preloaded: [Artifact]?
    private let initialIndex: Int

    @Environment(\.dismiss) private var dismiss
    @StateObject private var vm = ArtifactFeedViewModel()
    @State private var index = 0
    @State private var chromeHidden = false

    /// Height the artifact reserves for the floating top bar (its height plus
    /// the VStack's top padding, measured from the safe-area top) so content
    /// clears it. The safe-area inset (status bar / notch) is handled separately
    /// by SwiftUI.
    private static let topChromeInset: CGFloat = 64
    /// Height the artifact reserves for the floating dock (its height plus the
    /// VStack's bottom padding, measured from the safe-area bottom).
    private static let bottomChromeInset: CGFloat = 72

    /// Live canvas — artifacts fetched from Supabase.
    init(canvas: CanvasMeta) {
        self.feedTitle = canvas.title
        self.canvasId = canvas.id
        self.preloaded = nil
        self.initialIndex = 0
    }

    /// Offline demo — artifacts supplied directly (no auth/fetch).
    init(demoTitle: String, artifacts: [Artifact], startIndex: Int = 0) {
        self.feedTitle = demoTitle
        self.canvasId = nil
        self.preloaded = artifacts
        self.initialIndex = startIndex
    }

    var body: some View {
        ZStack {
            Color(.systemBackground).ignoresSafeArea()

            switch vm.phase {
            case .loading:
                ProgressView().controlSize(.large)
            case .failed(let message):
                ContentUnavailableView("Couldn't load artifacts", systemImage: "exclamationmark.triangle", description: Text(message))
            case .loaded(let artifacts):
                if artifacts.isEmpty {
                    ContentUnavailableView("No artifacts", systemImage: "square.dashed")
                } else {
                    content(artifacts)
                }
            }
        }
        .navigationBarBackButtonHidden(true)
        .toolbar(.hidden, for: .navigationBar)
        .task {
            if let preloaded {
                vm.setLoaded(preloaded)
            } else if let canvasId {
                await vm.load(canvasId: canvasId)
            }
            index = initialIndex
        }
    }

    private func content(_ artifacts: [Artifact]) -> some View {
        let idx = min(max(index, 0), artifacts.count - 1)
        let current = artifacts[idx]
        return ZStack {
            // The artifact WebView. It receives ALL touches and keyboard input
            // uncontested — nothing overlays the content area.
            //
            // When chrome is showing, the artifact is inset into the visible
            // region *between* the top bar and the dock (and stays within the
            // safe area), so sticky table headers and a calendar's month arrows
            // aren't hidden behind — or made un-tappable by — the glass chrome.
            // In immersive mode the insets collapse to fill the safe area.
            //
            // Only the padding values change with `chromeHidden` — the view's
            // identity is stable, so toggling chrome never recreates (reloads)
            // the WebView.
            ArtifactRenderView(artifact: current)
                .id(current.id)
                .padding(.top, chromeHidden ? 0 : Self.topChromeInset)
                .padding(.bottom, chromeHidden ? 0 : Self.bottomChromeInset)
                .animation(.easeInOut(duration: 0.2), value: chromeHidden)
                .transition(.opacity)

            // Floating chrome (top bar + dock). Hidden in immersive mode.
            VStack {
                topBar(current)
                Spacer()
                dock(artifacts, index: idx)
            }
            .padding(.horizontal, 14)
            .padding(.top, 6)
            .padding(.bottom, 12)
            .opacity(chromeHidden ? 0 : 1)
            .allowsHitTesting(!chromeHidden)
            .animation(.easeInOut(duration: 0.2), value: chromeHidden)

            // Immersive mode: a single small pill to bring chrome back. It's the
            // only overlay hit-target, and it doesn't cover the content.
            if chromeHidden {
                VStack {
                    HStack {
                        Spacer()
                        Button { toggleChrome() } label: {
                            Image(systemName: "arrow.up.left.and.arrow.down.right")
                                .font(.system(size: 14, weight: .semibold))
                                .frame(width: 40, height: 40)
                        }
                        .glassChrome(cornerRadius: 20)
                    }
                    Spacer()
                }
                .padding(.horizontal, 14)
                .padding(.top, 6)
                .transition(.opacity)
            }
        }
    }

    private func toggleChrome() {
        withAnimation(.easeInOut(duration: 0.2)) { chromeHidden.toggle() }
    }

    private func go(to newIndex: Int, count: Int) {
        guard newIndex >= 0, newIndex < count else { return }
        withAnimation(.easeInOut(duration: 0.2)) {
            index = newIndex
            chromeHidden = false
        }
    }

    // MARK: Liquid Glass chrome
    private func topBar(_ current: Artifact) -> some View {
        HStack {
            Button { dismiss() } label: {
                Image(systemName: "chevron.down").font(.system(size: 15, weight: .semibold))
            }
            Spacer()
            VStack(spacing: 1) {
                Text(current.title).font(.system(size: 13, weight: .medium)).lineLimit(1)
                Text(feedTitle).font(.system(size: 10)).foregroundStyle(.secondary).lineLimit(1)
            }
            Spacer()
            Button { toggleChrome() } label: {
                Image(systemName: "arrow.down.right.and.arrow.up.left")
                    .font(.system(size: 15, weight: .semibold))
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .glassChrome(cornerRadius: 18)
    }

    private func dock(_ artifacts: [Artifact], index idx: Int) -> some View {
        let current = artifacts[idx]
        return HStack {
            HStack(spacing: 8) {
                shareButton(current)
                copyButton(current)
            }
            Spacer()
            HStack(spacing: 6) {
                navButton("chevron.up", enabled: idx > 0) { go(to: idx - 1, count: artifacts.count) }
                Text("\(idx + 1) / \(artifacts.count)")
                    .font(.system(size: 12, weight: .medium))
                    .monospacedDigit().foregroundStyle(.secondary)
                    .frame(minWidth: 46)
                navButton("chevron.down", enabled: idx < artifacts.count - 1) { go(to: idx + 1, count: artifacts.count) }
            }
            Spacer()
            HStack(spacing: 8) {
                Image(systemName: "square.and.arrow.up").frame(width: 36, height: 36)
                Image(systemName: "doc.on.doc").frame(width: 36, height: 36)
            }
            .opacity(0).accessibilityHidden(true)
        }
        .padding(.horizontal, 10)
        .frame(height: 50)
        .glassChrome(cornerRadius: 24)
    }

    private func navButton(_ systemName: String, enabled: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: systemName).font(.system(size: 15, weight: .semibold)).frame(width: 34, height: 34)
        }
        .disabled(!enabled)
        .opacity(enabled ? 1 : 0.3)
    }

    @ViewBuilder
    private func shareButton(_ artifact: Artifact) -> some View {
        if let url = shareURL(for: artifact) {
            ShareLink(item: url) {
                Image(systemName: "square.and.arrow.up").font(.system(size: 15, weight: .medium)).frame(width: 36, height: 36)
            }
        }
    }

    private func copyButton(_ artifact: Artifact) -> some View {
        Button {
            Clipboard.copy(copyText(for: artifact))
        } label: {
            Image(systemName: "doc.on.doc").font(.system(size: 15, weight: .medium)).frame(width: 36, height: 36)
        }
    }

    private func shareURL(for artifact: Artifact) -> URL? {
        if artifact.kind.isLink, let url = artifact.linkURL { return url }
        return ArtifactWebViewer.renderURL(for: artifact, theme: "light")
    }

    private func copyText(for artifact: Artifact) -> String {
        if artifact.kind.isLink, let url = artifact.linkURL { return url.absoluteString }
        if artifact.kind == .table { return TableExport.tsv(from: artifact.data) }
        return artifact.title
    }
}
