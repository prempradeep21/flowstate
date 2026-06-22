import SwiftUI

@MainActor
final class LinksViewModel: ObservableObject {
    enum Phase: Equatable {
        case loading
        case loaded([Artifact])
        case failed(String)
    }

    @Published var phase: Phase = .loading
    private let repo = CanvasRepository()

    func load(userId: String) async {
        if DemoStore.isActive {
            phase = .loaded(DemoStore.links())
            return
        }
        phase = .loading
        do {
            phase = .loaded(try await repo.fetchAllLinks(userId: userId))
        } catch {
            phase = .failed(error.localizedDescription)
        }
    }
}

/// Dedicated Links tab: every link-type artifact across all canvases, each with
/// inline share + copy. Solid surfaces — no glass.
struct LinksView: View {
    @EnvironmentObject private var auth: AuthViewModel
    @StateObject private var vm = LinksViewModel()

    var body: some View {
        NavigationStack {
            Group {
                switch vm.phase {
                case .loading:
                    ProgressView().controlSize(.large)
                case .failed(let message):
                    ContentUnavailableView("Couldn't load links", systemImage: "exclamationmark.triangle", description: Text(message))
                case .loaded(let links):
                    if links.isEmpty {
                        ContentUnavailableView("No links yet", systemImage: "link")
                    } else {
                        List(links) { LinkRow(artifact: $0) }
                            .listStyle(.plain)
                    }
                }
            }
            .navigationTitle("Links")
            .refreshable { await vm.load(userId: auth.userId ?? "") }
        }
        .task { await vm.load(userId: auth.userId ?? "") }
    }
}

private struct LinkRow: View {
    let artifact: Artifact

    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: icon)
                .font(.system(size: 15))
                .frame(width: 30, height: 30)
                .background(Color.secondary.opacity(0.12), in: RoundedRectangle(cornerRadius: 8))
            VStack(alignment: .leading, spacing: 2) {
                Text(artifact.title).font(.system(size: 15, weight: .medium)).lineLimit(1)
                Text(artifact.domainLabel).font(.caption).foregroundStyle(.secondary).lineLimit(1)
            }
            Spacer()
            if let url = artifact.linkURL {
                ShareLink(item: url) {
                    Image(systemName: "square.and.arrow.up").font(.system(size: 15))
                }
                .buttonStyle(.borderless)
                Button {
                    Clipboard.copy(url.absoluteString)
                } label: {
                    Image(systemName: "doc.on.doc").font(.system(size: 15))
                }
                .buttonStyle(.borderless)
            }
        }
        .padding(.vertical, 4)
    }

    private var icon: String {
        switch artifact.kind {
        case .repo: return "chevron.left.forwardslash.chevron.right"
        case .googleDoc: return "doc.text"
        case .embed: return "rectangle.on.rectangle"
        default: return "globe"
        }
    }
}
