import Foundation

/// Serializes a table artifact's data to TSV for the copy action.
enum TableExport {
    private static func cellText(_ value: JSONValue?) -> String {
        guard let value else { return "" }
        if let s = value.stringValue { return s }
        if let v = value["value"]?.stringValue { return v }
        if let badge = value["badge"]?.stringValue { return badge }
        if let tags = value["tags"]?.arrayValue {
            return tags.compactMap { $0["label"]?.stringValue }.joined(separator: ", ")
        }
        return ""
    }

    static func tsv(from data: JSONValue) -> String {
        let cols = data["columns"]?.arrayValue ?? []
        let keys = cols.compactMap { $0["key"]?.stringValue }
        let header = cols.compactMap { $0["label"]?.stringValue }.joined(separator: "\t")
        let rows = (data["rows"]?.arrayValue ?? []).map { row -> String in
            keys.map { cellText(row.objectValue?[$0]) }.joined(separator: "\t")
        }
        return ([header] + rows).joined(separator: "\n")
    }
}
