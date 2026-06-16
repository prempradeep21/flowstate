import Foundation

/// Swift port of `buildCustomSrcdoc` (lib/customArtifact.ts) so `custom` HTML
/// artifacts render in a local WKWebView with no network round-trip and full
/// touch + keyboard interactivity — matching the web app's sandboxed iframe.
enum CustomSrcdoc {
    private static let baseCSS = """
      *, *::before, *::after { box-sizing: border-box; }
      html, body { margin: 0; height: 100%; }
      body {
        font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
        font-size: 14px;
        line-height: 1.5;
        color: #1a1a1a;
        background: #ffffff;
        overflow: auto;
      }
    """

    static func build(from data: JSONValue) -> String {
        let html = data["html"]?.stringValue ?? ""
        let css = "\(baseCSS)\n\(data["css"]?.stringValue ?? "")"
        let js = (data["js"]?.stringValue ?? "").trimmingCharacters(in: .whitespacesAndNewlines)

        let safeCSS = css.replacingOccurrences(of: "</style", with: "<\\/style", options: .caseInsensitive)
        let scriptBlock = js.isEmpty
            ? ""
            : "<script>\(js.replacingOccurrences(of: "</script", with: "<\\/script", options: .caseInsensitive))</script>"

        return """
        <!DOCTYPE html>
        <html lang="en">
        <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>\(safeCSS)</style>
        </head>
        <body>
        \(html)
        \(scriptBlock)
        </body>
        </html>
        """
    }
}
