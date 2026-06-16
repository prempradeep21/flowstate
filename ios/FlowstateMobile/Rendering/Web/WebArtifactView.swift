import SwiftUI
import WebKit

/// Renders an artifact in a WKWebView.
///  • `custom` → local srcdoc (ported buildCustomSrcdoc), fully interactive,
///    no network needed.
///  • other complex kinds → the web single-artifact viewer route, with the
///    Supabase access token passed in the URL fragment so the page can
///    restore the session client-side (fragments aren't sent to the server).
struct WebArtifactView: View {
    let artifact: Artifact
    @EnvironmentObject private var auth: AuthViewModel
    @State private var resolvedURL: URL?
    @State private var resolving = true

    var body: some View {
        Group {
            if artifact.kind == .custom {
                WebView(content: .html(CustomSrcdoc.build(from: artifact.data)))
            } else if let url = resolvedURL {
                WebView(content: .url(url))
            } else if resolving {
                ProgressView()
            } else {
                ContentUnavailableView("Couldn't open artifact", systemImage: "wifi.slash")
            }
        }
        .task {
            guard artifact.kind != .custom else { return }
            let base = ArtifactWebViewer.url(canvasId: artifact.canvasId, artifactId: artifact.id)
            if let token = await auth.currentAccessToken(),
               var comps = URLComponents(url: base, resolvingAgainstBaseURL: false) {
                comps.fragment = "at=\(token)"
                resolvedURL = comps.url
            } else {
                resolvedURL = base
            }
            resolving = false
        }
    }
}

private struct WebView: UIViewRepresentable {
    enum Content {
        case html(String)
        case url(URL)
    }

    let content: Content

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.defaultWebpagePreferences.allowsContentJavaScript = true
        config.allowsInlineMediaPlayback = true

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.isOpaque = true
        webView.backgroundColor = .systemBackground
        // Inner content scrolls; the feed pages between artifacts.
        webView.scrollView.contentInsetAdjustmentBehavior = .never

        switch content {
        case .html(let html):
            webView.loadHTMLString(html, baseURL: nil)
        case .url(let url):
            webView.load(URLRequest(url: url))
        }
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        // Each artifact owns its WebView instance; content is loaded once in
        // makeUIView, so nothing to update here.
    }
}
