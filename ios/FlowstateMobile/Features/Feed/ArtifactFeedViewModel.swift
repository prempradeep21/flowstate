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

    func load(canvasId: String) async {
        phase = .loading
        do {
            phase = .loaded(try await repo.fetchArtifacts(canvasId: canvasId))
        } catch {
            phase = .failed(error.localizedDescription)
        }
    }
}
