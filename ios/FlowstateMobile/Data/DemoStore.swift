import Foundation

/// When active, the app runs without sign-in and the view models serve bundled
/// sample data through the REAL navigation (canvas list → feed, Links tab) — so
/// the demo matches the planned app structure, not a flat feed.
enum DemoStore {
    static var isActive = false
    static let canvasId = "demo-catalog"

    private static var cached: [Artifact]?
    static func artifacts() -> [Artifact] {
        if let cached { return cached }
        let loaded = DemoData.loadArtifacts()
        cached = loaded
        return loaded
    }

    static func canvases() -> [CanvasMeta] {
        [CanvasMeta(
            id: canvasId,
            title: "Sample artifacts",
            isDefault: true,
            updatedAt: Date(),
            artifactCount: artifacts().count
        )]
    }

    static func links() -> [Artifact] {
        artifacts().filter { $0.kind.isLink }
    }
}
