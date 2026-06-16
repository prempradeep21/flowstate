import SwiftUI

@MainActor
final class CanvasListViewModel: ObservableObject {
    enum Phase: Equatable {
        case loading
        case loaded([CanvasMeta])
        case failed(String)
    }

    @Published var phase: Phase = .loading
    private let repo = CanvasRepository()

    func load(userId: String) async {
        phase = .loading
        do {
            let canvases = try await repo.fetchCanvasList(userId: userId)
            phase = .loaded(canvases)
        } catch {
            phase = .failed(error.localizedDescription)
        }
    }
}

struct CanvasListView: View {
    @EnvironmentObject private var auth: AuthViewModel
    @StateObject private var vm = CanvasListViewModel()
    @State private var query = ""

    var body: some View {
        NavigationStack {
            Group {
                switch vm.phase {
                case .loading:
                    ProgressView().controlSize(.large)
                case .failed(let message):
                    ContentUnavailableView("Couldn't load canvases", systemImage: "exclamationmark.triangle", description: Text(message))
                case .loaded(let canvases):
                    let filtered = query.isEmpty
                        ? canvases
                        : canvases.filter { $0.title.localizedCaseInsensitiveContains(query) }
                    if filtered.isEmpty {
                        ContentUnavailableView("No canvases", systemImage: "square.grid.2x2")
                    } else {
                        List(filtered) { canvas in
                            NavigationLink(value: canvas) {
                                CanvasRow(canvas: canvas)
                            }
                        }
                        .listStyle(.plain)
                    }
                }
            }
            .navigationTitle("Canvases")
            .navigationDestination(for: CanvasMeta.self) { canvas in
                ArtifactFeedView(canvas: canvas)
            }
            .searchable(text: $query, prompt: "Search canvases")
            .refreshable { if let uid = auth.userId { await vm.load(userId: uid) } }
        }
        .task { if let uid = auth.userId { await vm.load(userId: uid) } }
    }
}

private struct CanvasRow: View {
    let canvas: CanvasMeta

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(canvas.title)
                .font(.system(size: 16, weight: .medium))
            Text("\(canvas.artifactCount) artifact\(canvas.artifactCount == 1 ? "" : "s") · \(canvas.updatedAt.formatted(.relative(presentation: .named)))")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding(.vertical, 4)
    }
}
