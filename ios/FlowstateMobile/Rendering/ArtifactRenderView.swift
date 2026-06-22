import SwiftUI

/// Renders an artifact. Every type goes through the WebView so it uses the real
/// web components — guaranteeing pixel-parity with the web app (no native
/// re-implementations that could drift). Glass is never applied here; this is
/// artifact content.
struct ArtifactRenderView: View {
    let artifact: Artifact

    var body: some View {
        WebArtifactView(artifact: artifact)
    }
}
