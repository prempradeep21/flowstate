import Foundation

/// Mirrors the web app's `ArtifactKind` (lib/artifactTypes.ts). Raw values match
/// the strings stored in the canvas JSONB exactly.
enum ArtifactKind: String, Codable {
    case table
    case code
    case custom
    case images
    case todo
    case calendar
    case map
    case streetview
    case website
    case repo
    case embed
    case googleDoc = "google-doc"
    case timeline
    case chart
    case stickynote
    case threeD = "3d"   // excluded from V1
    case audio           // excluded from V1
    case video           // normalized to images on web

    /// V1 excludes 3d and audio per product scope.
    var isSupportedInV1: Bool {
        switch self {
        case .threeD, .audio: return false
        default: return true
        }
    }

    /// Renderer routing for the hybrid strategy.
    enum RenderStrategy { case native, web }
    var renderStrategy: RenderStrategy {
        switch self {
        case .table, .todo, .stickynote, .calendar:
            return .native
        default:
            return .web
        }
    }

    /// Link-type artifacts surfaced in the dedicated Links tab.
    var isLink: Bool {
        switch self {
        case .website, .repo, .embed, .googleDoc: return true
        default: return false
        }
    }
}

/// A single artifact resolved from a canvas snapshot, ready to render.
struct Artifact: Identifiable, Equatable {
    let id: String
    let title: String
    let kind: ArtifactKind
    /// The latest (or node-pinned) version's `data` payload.
    let data: JSONValue
    /// The originating canvas — needed by the WebView viewer and Links tab.
    let canvasId: String
    let canvasTitle: String
}
