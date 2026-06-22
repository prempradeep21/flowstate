import Foundation

/// Builds the URL for the stateless web artifact renderer (`/m/render`). The full
/// payload + theme are passed inline in the URL fragment, so every artifact
/// renders through the real web components — guaranteeing parity with the web app.
enum ArtifactWebViewer {
    static func renderURL(for artifact: Artifact, theme: String) -> URL? {
        let payload: JSONValue = .object([
            "type": .string(artifact.kind.rawValue),
            "title": .string(artifact.title),
            "data": artifact.data,
        ])
        // Use base64url (RFC 4648 §5) so URLSearchParams on the JS side doesn't
        // misinterpret '+' as a space or '/' as a path separator.
        let b64url = Data(payload.jsonString().utf8)
            .base64EncodedString()
            .replacingOccurrences(of: "+", with: "-")
            .replacingOccurrences(of: "/", with: "_")
            .replacingOccurrences(of: "=", with: "")

        var comps = URLComponents(
            url: AppEnvironment.webBaseURL.appendingPathComponent("m").appendingPathComponent("render"),
            resolvingAgainstBaseURL: false
        )
        comps?.fragment = "payload=\(b64url)&theme=\(theme)"
        return comps?.url
    }
}
