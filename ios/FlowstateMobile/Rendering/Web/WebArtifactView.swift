import SwiftUI
import WebKit

struct WebArtifactView: View {
    let artifact: Artifact
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        let theme = colorScheme == .dark ? "dark" : "light"
        if let url = ArtifactWebViewer.renderURL(for: artifact, theme: theme) {
            WebView(url: url, isDark: colorScheme == .dark)
        } else {
            ContentUnavailableView("Couldn't open artifact", systemImage: "wifi.slash")
        }
    }
}

// MARK: - UIViewRepresentable

private struct WebView: UIViewRepresentable {
    let url: URL
    let isDark: Bool

    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeUIView(context: Context) -> WKWebView {
        let c = context.coordinator
        NSLog("🟡 WV makeUIView #\(c.id) \(url.fragment?.prefix(30) ?? "")")

        let config = WKWebViewConfiguration()
        config.defaultWebpagePreferences.allowsContentJavaScript = true
        config.allowsInlineMediaPlayback = true

        // Inject console capture into ALL frames (forMainFrameOnly: false) so we
        // see errors from the sandboxed <iframe srcDoc> used by custom HTML widgets.
        let capture = """
        (function(){
          var h=function(t,a){try{window.webkit.messageHandlers.log.postMessage(
            t+': '+Array.from(a).map(function(x){
              try{return typeof x==='object'?JSON.stringify(x):String(x)}
              catch(e){return String(x)}
            }).join(' '));}catch(e){}};
          ['log','warn','error','info'].forEach(function(k){
            var o=console[k];console[k]=function(){h(k.toUpperCase(),arguments);o.apply(console,arguments);};
          });
          window.addEventListener('error',function(e){h('ERROR',[e.message,e.filename+':'+e.lineno]);});
          window.addEventListener('unhandledrejection',function(e){h('REJECTION',[String(e.reason)]);});
        })();
        """
        let userScript = WKUserScript(source: capture, injectionTime: .atDocumentStart, forMainFrameOnly: false)
        config.userContentController.addUserScript(userScript)
        // WeakMessageHandler breaks the retain cycle:
        // WKUserContentController holds a strong ref to its handlers, which
        // would otherwise keep the Coordinator (and thus WKWebView) alive forever.
        config.userContentController.add(WeakMessageHandler(c), name: "log")

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = c
        webView.isOpaque = false
        webView.backgroundColor = isDark ? .black : .white
        webView.scrollView.backgroundColor = isDark ? .black : .white
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.scrollView.keyboardDismissMode = .interactive
        // Deliver touches immediately — the default UIScrollView delay makes buttons
        // feel unresponsive and can absorb a tap without firing the click handler.
        webView.scrollView.delaysContentTouches = false
        // Prevent accidental edge-swipe back/forward within the WebView which would
        // look like a reload/blank flash in a single-page viewer.
        webView.allowsBackForwardNavigationGestures = false
        webView.allowsLinkPreview = false

        c.lastRequestedURL = url
        webView.load(URLRequest(url: url))
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        // Only reload when the URL actually changes (artifact navigated or theme
        // toggled). Every other SwiftUI re-render — from animations, chrome show/
        // hide, @State changes, etc. — is a true no-op so the page never reloads.
        let newStr = url.absoluteString
        guard context.coordinator.lastRequestedURL?.absoluteString != newStr else { return }
        NSLog("🔄 WV updateUIView: URL changed, loading #\(context.coordinator.id)")
        context.coordinator.lastRequestedURL = url
        webView.load(URLRequest(url: url))
    }
}

// MARK: - Coordinator

extension WebView {
    final class Coordinator: NSObject, WKNavigationDelegate, WKScriptMessageHandler {
        /// Unique ID so logs let us tell apart separate WKWebView instances.
        let id = Int.random(in: 1000...9999)
        /// The URL we most recently requested (NOT webView.url, which normalises
        /// fragments). Compared in updateUIView to detect real artifact changes.
        var lastRequestedURL: URL?

        // MARK: WKNavigationDelegate

        func webView(_ wv: WKWebView, decidePolicyFor action: WKNavigationAction,
                     decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            let url = action.request.url?.absoluteString ?? "nil"
            let type = action.navigationType.rawValue
            // Log sub-resource requests too (type -1) so we can see chunk loads.
            NSLog("📡 REQ #\(id) type=\(type) \(url.prefix(100))")
            decisionHandler(.allow)
        }

        func webView(_ wv: WKWebView, didStartProvisionalNavigation _: WKNavigation!) {
            NSLog("🔵 NAV_START #\(id)")
        }
        func webView(_ wv: WKWebView, didFinish _: WKNavigation!) {
            NSLog("🟢 NAV_FINISH #\(id) url=\(wv.url?.absoluteString.suffix(50) ?? "nil")")
        }
        func webView(_ wv: WKWebView, didFailProvisionalNavigation _: WKNavigation!, withError e: Error) {
            NSLog("🔴 NAV_FAIL_PROVISIONAL #\(id): \(e.localizedDescription)")
        }
        func webView(_ wv: WKWebView, didFail _: WKNavigation!, withError e: Error) {
            NSLog("🔴 NAV_FAIL #\(id): \(e.localizedDescription)")
        }
        func webViewWebContentProcessDidTerminate(_ wv: WKWebView) {
            NSLog("🔴 PROCESS_TERMINATED #\(id)")
        }

        // MARK: WKScriptMessageHandler

        func userContentController(_ c: WKUserContentController, didReceive m: WKScriptMessage) {
            NSLog("📜 WEB #\(id): \(m.body)")
        }
    }
}

// MARK: - WeakMessageHandler

/// WKUserContentController holds a strong reference to its message handlers.
/// Without this proxy, that creates a retain cycle that prevents cleanup.
private final class WeakMessageHandler: NSObject, WKScriptMessageHandler {
    private weak var delegate: WKScriptMessageHandler?
    init(_ delegate: WKScriptMessageHandler) { self.delegate = delegate }
    func userContentController(_ c: WKUserContentController, didReceive m: WKScriptMessage) {
        delegate?.userContentController(c, didReceive: m)
    }
}
