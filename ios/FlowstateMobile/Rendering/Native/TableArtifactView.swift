import SwiftUI

/// Native table renderer. Data shape (lib/artifactTypes.ts TableArtifactData):
///   { columns: [{ key, label }], rows: [ { [key]: string | { value, tags, badge } } ] }
struct TableArtifactView: View {
    let data: JSONValue

    private struct Column: Identifiable { let id = UUID(); let key: String; let label: String }

    private var columns: [Column] {
        (data["columns"]?.arrayValue ?? []).compactMap { col in
            guard let key = col["key"]?.stringValue else { return nil }
            return Column(key: key, label: col["label"]?.stringValue ?? key)
        }
    }

    private var rows: [[String: JSONValue]] {
        (data["rows"]?.arrayValue ?? []).compactMap { $0.objectValue }
    }

    var body: some View {
        ScrollView([.horizontal, .vertical]) {
            VStack(alignment: .leading, spacing: 0) {
                // Header
                HStack(spacing: 0) {
                    ForEach(columns) { col in
                        Text(col.label)
                            .font(.system(size: 12, weight: .medium))
                            .foregroundStyle(.secondary)
                            .frame(width: 140, alignment: .leading)
                            .padding(.vertical, 10).padding(.horizontal, 12)
                    }
                }
                .background(Color(.secondarySystemBackground))
                Divider()
                // Rows
                ForEach(Array(rows.enumerated()), id: \.offset) { _, row in
                    HStack(spacing: 0) {
                        ForEach(columns) { col in
                            cell(row[col.key])
                                .frame(width: 140, alignment: .leading)
                                .padding(.vertical, 10).padding(.horizontal, 12)
                        }
                    }
                    Divider()
                }
            }
            .padding(.top, 64) // clears the glass top bar
            .padding(.bottom, 80) // clears the glass dock
        }
        .background(Color(.systemBackground))
    }

    @ViewBuilder
    private func cell(_ value: JSONValue?) -> some View {
        if let tags = value?["tags"]?.arrayValue, !tags.isEmpty {
            HStack(spacing: 4) {
                ForEach(Array(tags.enumerated()), id: \.offset) { _, tag in
                    TagPill(label: tag["label"]?.stringValue ?? "",
                            tone: tag["tone"]?.stringValue ?? "neutral")
                }
            }
        } else {
            Text(Self.cellText(value))
                .font(.system(size: 13))
                .lineLimit(2)
        }
    }

    /// Plain-text cell value for copy + non-tag display.
    static func cellText(_ value: JSONValue?) -> String {
        guard let value else { return "" }
        if let s = value.stringValue { return s }
        if let v = value["value"]?.stringValue { return v }
        if let badge = value["badge"]?.stringValue { return badge }
        if let tags = value["tags"]?.arrayValue {
            return tags.compactMap { $0["label"]?.stringValue }.joined(separator: ", ")
        }
        return ""
    }

    /// TSV serialization for the copy action.
    static func tsv(from data: JSONValue) -> String {
        let cols = (data["columns"]?.arrayValue ?? [])
        let keys = cols.compactMap { $0["key"]?.stringValue }
        let header = cols.compactMap { $0["label"]?.stringValue }.joined(separator: "\t")
        let rows = (data["rows"]?.arrayValue ?? []).map { row -> String in
            keys.map { cellText(row[$0]) }.joined(separator: "\t")
        }
        return ([header] + rows).joined(separator: "\n")
    }
}

private struct TagPill: View {
    let label: String
    let tone: String

    var body: some View {
        Text(label)
            .font(.system(size: 11, weight: .medium))
            .padding(.horizontal, 7).padding(.vertical, 2)
            .background(color.opacity(0.18), in: Capsule())
            .foregroundStyle(color)
    }

    private var color: Color {
        switch tone {
        case "success": return .green
        case "warning": return .orange
        case "danger": return .red
        case "info": return .blue
        default: return .secondary
        }
    }
}
