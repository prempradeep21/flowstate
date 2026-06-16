import Foundation
import Supabase

/// Reads canvases + artifacts directly from Supabase using the existing RLS
/// policies (owner_id = auth.uid()). No backend changes required for reads.
struct CanvasRepository {
    private let client = SupabaseManager.client

    // Row shapes returned by PostgREST.
    private struct CanvasMetaRow: Decodable {
        let id: String
        let title: String
        let isDefault: Bool
        let updatedAt: String
        let state: JSONValue?

        enum CodingKeys: String, CodingKey {
            case id, title, state
            case isDefault = "is_default"
            case updatedAt = "updated_at"
        }
    }

    private struct CanvasStateRow: Decodable {
        let id: String
        let title: String
        let state: JSONValue
    }

    private static let iso: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f
    }()

    /// Canvas list for the signed-in user, recency-first.
    /// Pulls `state` too so we can show an accurate artifact count.
    func fetchCanvasList(userId: String) async throws -> [CanvasMeta] {
        let rows: [CanvasMetaRow] = try await client
            .from("canvases")
            .select("id,title,is_default,updated_at,state")
            .eq("owner_id", value: userId)
            .order("updated_at", ascending: false)
            .execute()
            .value

        return rows.map { row in
            CanvasMeta(
                id: row.id,
                title: row.title,
                isDefault: row.isDefault,
                updatedAt: Self.iso.date(from: row.updatedAt) ?? .distantPast,
                artifactCount: row.state.map(CanvasSnapshotParser.artifactCount(from:)) ?? 0
            )
        }
    }

    /// Full ordered artifact list for one canvas.
    func fetchArtifacts(canvasId: String) async throws -> [Artifact] {
        let row: CanvasStateRow = try await client
            .from("canvases")
            .select("id,title,state")
            .eq("id", value: canvasId)
            .single()
            .execute()
            .value

        return CanvasSnapshotParser.artifacts(
            from: row.state, canvasId: row.id, canvasTitle: row.title
        )
    }

    /// Every link-type artifact across all the user's canvases, for the Links tab.
    func fetchAllLinks(userId: String) async throws -> [Artifact] {
        let rows: [CanvasStateRow] = try await client
            .from("canvases")
            .select("id,title,state")
            .eq("owner_id", value: userId)
            .order("updated_at", ascending: false)
            .execute()
            .value

        return rows.flatMap { row in
            CanvasSnapshotParser
                .artifacts(from: row.state, canvasId: row.id, canvasTitle: row.title)
                .filter { $0.kind.isLink }
        }
    }
}
