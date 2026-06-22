import Foundation

/// Loads the bundled sample canvas (DemoCanvas.json — exported from the web
/// artifact catalog) so artifacts can be browsed without signing in.
enum DemoData {
    private struct CanvasRow: Decodable {
        let id: String
        let title: String
        let state: JSONValue
    }

    static func loadArtifacts() -> [Artifact] {
        guard let url = Bundle.main.url(forResource: "DemoCanvas", withExtension: "json"),
              let data = try? Data(contentsOf: url),
              let row = try? JSONDecoder().decode(CanvasRow.self, from: data) else {
            return []
        }
        return CanvasSnapshotParser.artifacts(
            from: row.state, canvasId: row.id, canvasTitle: row.title
        )
    }
}
