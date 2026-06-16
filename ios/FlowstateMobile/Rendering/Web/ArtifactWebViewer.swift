import Foundation

/// Builds the URL for the web single-artifact viewer route that the WKWebView
/// loads for complex/interactive artifact types. The matching Next.js route
/// (added under app/m/artifact/...) renders one artifact full-bleed using the
/// existing <ArtifactContent> component, so iOS gets exact web parity.
enum ArtifactWebViewer {
    static func url(canvasId: String, artifactId: String) -> URL {
        AppEnvironment.webBaseURL
            .appendingPathComponent("m")
            .appendingPathComponent("artifact")
            .appendingPathComponent(canvasId)
            .appendingPathComponent(artifactId)
    }
}
