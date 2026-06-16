import Foundation

/// Link extraction for link-type artifacts (website / repo / embed / google-doc).
extension Artifact {
    var linkURL: URL? {
        let raw = data["url"]?.stringValue ?? data["repoUrl"]?.stringValue
        return raw.flatMap { URL(string: $0) }
    }

    var domainLabel: String {
        data["domainLabel"]?.stringValue ?? linkURL?.host ?? ""
    }
}
