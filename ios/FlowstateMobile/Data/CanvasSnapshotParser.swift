import Foundation

/// Decodes the `canvases.state` JSONB (a `CanvasSnapshot`) into ordered artifacts.
///
/// Snapshot shape (see lib/canvasSnapshot.ts):
///   sessionArtifacts:    { [artifactId]: { id, title, kind, versions[], latestVersionId } }
///   canvasArtifactNodes: { [nodeId]: { artifactId, versionId } }
///   canvasArtifactOrder: [nodeId]   ← placement order on the canvas
///
/// Questions are `cards`, not artifacts, so they're excluded by construction.
enum CanvasSnapshotParser {

    private struct Snapshot: Decodable {
        let sessionArtifacts: [String: SessionArtifact]?
        let canvasArtifactNodes: [String: ArtifactNode]?
        let canvasArtifactOrder: [String]?
    }

    private struct SessionArtifact: Decodable {
        let id: String
        let title: String?
        let kind: String
        let versions: [Version]?
        let latestVersionId: String?
    }

    private struct Version: Decodable {
        let id: String
        let payload: Payload?
    }

    private struct Payload: Decodable {
        let title: String?
        let data: JSONValue?
    }

    private struct ArtifactNode: Decodable {
        let artifactId: String
        let versionId: String?
    }

    /// Returns artifacts in canvas placement order, V1-supported kinds only,
    /// de-duplicated by artifact id (an artifact may have multiple canvas nodes).
    static func artifacts(from state: JSONValue, canvasId: String, canvasTitle: String) -> [Artifact] {
        guard let data = try? JSONEncoder().encode(state),
              let snapshot = try? JSONDecoder().decode(Snapshot.self, from: data),
              let session = snapshot.sessionArtifacts else {
            return []
        }

        // Resolve ordering: node order first, then any stragglers not placed.
        var orderedArtifactIds: [String] = []
        var pinnedVersion: [String: String] = [:]
        if let order = snapshot.canvasArtifactOrder, let nodes = snapshot.canvasArtifactNodes {
            for nodeId in order {
                guard let node = nodes[nodeId] else { continue }
                orderedArtifactIds.append(node.artifactId)
                if let v = node.versionId { pinnedVersion[node.artifactId] = v }
            }
        }
        // Append any session artifacts that weren't placed via a node.
        for id in session.keys where !orderedArtifactIds.contains(id) {
            orderedArtifactIds.append(id)
        }

        var seen = Set<String>()
        var result: [Artifact] = []
        for artifactId in orderedArtifactIds {
            guard seen.insert(artifactId).inserted,
                  let sa = session[artifactId],
                  let kind = ArtifactKind(rawValue: sa.kind),
                  kind.isSupportedInV1 else { continue }

            let versionId = pinnedVersion[artifactId] ?? sa.latestVersionId
            let version = sa.versions?.first(where: { $0.id == versionId })
                ?? sa.versions?.last
            let payload = version?.payload

            result.append(Artifact(
                id: artifactId,
                title: sa.title ?? payload?.title ?? "Untitled",
                kind: kind,
                data: payload?.data ?? .null,
                canvasId: canvasId,
                canvasTitle: canvasTitle
            ))
        }
        return result
    }

    /// Count of V1-supported artifacts, for the canvas list subtitle.
    static func artifactCount(from state: JSONValue) -> Int {
        artifacts(from: state, canvasId: "", canvasTitle: "").count
    }
}
