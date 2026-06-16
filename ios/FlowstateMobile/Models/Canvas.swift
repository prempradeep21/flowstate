import Foundation

/// Lightweight canvas metadata for the list page.
struct CanvasMeta: Identifiable, Equatable, Hashable {
    let id: String
    let title: String
    let isDefault: Bool
    let updatedAt: Date
    let artifactCount: Int
}
