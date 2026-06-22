import Foundation

@MainActor
final class ArtifactFeedViewModel: ObservableObject {
    enum Phase: Equatable {
        case loading
        case loaded([Artifact])
        case failed(String)
    }

    @Published var phase: Phase = .loading
    private let repo = CanvasRepository()

    /// Use artifacts supplied directly (offline demo).
    func setLoaded(_ artifacts: [Artifact]) {
        phase = .loaded(artifacts)
    }

    func load(canvasId: String) async {
        if DemoStore.isActive {
            phase = .loaded(DemoStore.artifacts())
            return
        }
        phase = .loading
        do {
            phase = .loaded(try await repo.fetchArtifacts(canvasId: canvasId))
        } catch {
            phase = .failed(error.localizedDescription)
        }
    }
}
