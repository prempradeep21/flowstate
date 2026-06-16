import SwiftUI

/// Full-screen, vertically paged artifact feed. Each artifact fills the screen
/// and snaps into place (paged scroll). The artifact content renders identically
/// to the web app; only the top bar and bottom dock are Liquid Glass chrome.
struct ArtifactFeedView: View {
    let canvas: CanvasMeta
    @EnvironmentObject private var auth: AuthViewModel
    @Environment(\.dismiss) private var dismiss
    @StateObject private var vm = ArtifactFeedViewModel()
    @State private var currentId: String?

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
                    feed(artifacts)
                    chrome(artifacts)
                }
            }
        }
        .navigationBarBackButtonHidden(true)
        .toolbar(.hidden, for: .navigationBar)
        .task { await vm.load(canvasId: canvas.id) }
    }

    // MARK: Paged feed (content only — never glass)
    private func feed(_ artifacts: [Artifact]) -> some View {
        ScrollView(.vertical) {
            LazyVStack(spacing: 0) {
                ForEach(artifacts) { artifact in
                    ArtifactRenderView(artifact: artifact)
                        .containerRelativeFrame([.horizontal, .vertical])
                        .id(artifact.id)
                }
            }
            .scrollTargetLayout()
        }
        .scrollTargetBehavior(.paging)
        .scrollPosition(id: $currentId)
        .ignoresSafeArea()
        .onAppear { if currentId == nil { currentId = artifacts.first?.id } }
    }

    // MARK: Floating Liquid Glass chrome
    private func chrome(_ artifacts: [Artifact]) -> some View {
        let index = artifacts.firstIndex { $0.id == currentId } ?? 0
        let current = artifacts.indices.contains(index) ? artifacts[index] : nil
        return VStack {
            topBar(current)
            Spacer()
            if let current { dock(current, index: index, total: artifacts.count) }
        }
        .padding(.horizontal, 14)
        .padding(.top, 6)
        .padding(.bottom, 12)
    }

    private func topBar(_ current: Artifact?) -> some View {
        HStack {
            Button { dismiss() } label: {
                Image(systemName: "chevron.down").font(.system(size: 15, weight: .semibold))
            }
            Spacer()
            VStack(spacing: 1) {
                Text(current?.title ?? canvas.title).font(.system(size: 13, weight: .medium)).lineLimit(1)
                Text(canvas.title).font(.system(size: 10)).foregroundStyle(.secondary).lineLimit(1)
            }
            Spacer()
            Image(systemName: "ellipsis").font(.system(size: 15, weight: .semibold)).opacity(0.001) // balances layout
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .glassChrome(cornerRadius: 18)
    }

    private func dock(_ current: Artifact, index: Int, total: Int) -> some View {
        HStack {
            HStack(spacing: 8) {
                shareButton(current)
                copyButton(current)
            }
            Spacer()
            Text("\(index + 1) / \(total)")
                .font(.system(size: 12, weight: .medium))
                .monospacedDigit()
                .foregroundStyle(.secondary)
            Spacer()
            // Fullscreen affordance (web parity hook — opens viewer).
            shareButton(current).opacity(0.001).accessibilityHidden(true)
            Image(systemName: "arrow.up.left.and.arrow.down.right")
                .font(.system(size: 15, weight: .medium))
                .frame(width: 36, height: 36)
        }
        .padding(.horizontal, 10)
        .frame(height: 50)
        .glassChrome(cornerRadius: 24)
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

    // MARK: Share / copy payloads
    private func shareURL(for artifact: Artifact) -> URL? {
        if artifact.kind.isLink, let url = artifact.linkURL { return url }
        return ArtifactWebViewer.url(canvasId: artifact.canvasId, artifactId: artifact.id)
    }

    private func copyText(for artifact: Artifact) -> String {
        if artifact.kind.isLink, let url = artifact.linkURL { return url.absoluteString }
        if artifact.kind == .table { return TableArtifactView.tsv(from: artifact.data) }
        return artifact.title
    }
}
