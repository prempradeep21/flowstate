import SwiftUI

/// Native todo renderer. Data shape (TodoArtifactData):
///   { items: [{ id, label, checked, dueDate?, priority? }] }
/// Read-only in V1 — checkboxes reflect state but don't mutate.
struct TodoArtifactView: View {
    let data: JSONValue

    private var items: [JSONValue] { data["items"]?.arrayValue ?? [] }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                ForEach(Array(items.enumerated()), id: \.offset) { _, item in
                    HStack(alignment: .top, spacing: 10) {
                        Image(systemName: (item["checked"]?.boolValue ?? false) ? "checkmark.circle.fill" : "circle")
                            .font(.system(size: 18))
                            .foregroundStyle((item["checked"]?.boolValue ?? false) ? .green : .secondary)
                        VStack(alignment: .leading, spacing: 3) {
                            Text(item["label"]?.stringValue ?? "")
                                .font(.system(size: 16))
                                .strikethrough(item["checked"]?.boolValue ?? false)
                            if let due = item["dueDate"]?.stringValue, !due.isEmpty {
                                Text(due).font(.caption).foregroundStyle(.secondary)
                            }
                        }
                        Spacer()
                        if let priority = item["priority"]?.stringValue {
                            PriorityBadge(priority: priority)
                        }
                    }
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 70)
            .padding(.bottom, 80)
        }
        .background(Color(.systemBackground))
    }
}

private struct PriorityBadge: View {
    let priority: String
    var body: some View {
        Text(priority.capitalized)
            .font(.system(size: 11, weight: .medium))
            .padding(.horizontal, 7).padding(.vertical, 2)
            .background(color.opacity(0.18), in: Capsule())
            .foregroundStyle(color)
    }
    private var color: Color {
        switch priority {
        case "high": return .red
        case "medium": return .orange
        default: return .secondary
        }
    }
}
