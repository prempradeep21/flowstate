import SwiftUI

/// Hybrid renderer router:
///   • Native SwiftUI for simple data types (table, todo, stickynote, calendar)
///   • WKWebView for everything else — reusing the web app's own renderers so
///     complex/interactive artifacts stay pixel-identical to web.
/// Glass is never applied here; this is artifact content.
struct ArtifactRenderView: View {
    let artifact: Artifact

    var body: some View {
        switch artifact.kind.renderStrategy {
        case .native:
            nativeView
        case .web:
            WebArtifactView(artifact: artifact)
        }
    }

    @ViewBuilder
    private var nativeView: some View {
        switch artifact.kind {
        case .table:      TableArtifactView(data: artifact.data)
        case .todo:       TodoArtifactView(data: artifact.data)
        case .stickynote: StickyNoteArtifactView(data: artifact.data)
        case .calendar:   CalendarArtifactView(data: artifact.data)
        default:          WebArtifactView(artifact: artifact)
        }
    }
}
