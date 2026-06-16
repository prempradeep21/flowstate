import SwiftUI

/// Native calendar renderer (lightweight). Data shape (CalendarArtifactData):
///   { viewYear, viewMonth, highlightedDates: [ISO], events: [{ id, title, startDate, endDate }] }
/// V1 shows the event list for the month; full grid is a later refinement.
struct CalendarArtifactView: View {
    let data: JSONValue

    private var events: [JSONValue] { data["events"]?.arrayValue ?? [] }

    private var monthLabel: String {
        let year = Int(data["viewYear"]?.doubleValue ?? 0)
        let month = Int(data["viewMonth"]?.doubleValue ?? 0)
        var comps = DateComponents(); comps.year = year; comps.month = month + 1
        guard let date = Calendar.current.date(from: comps) else { return "" }
        return date.formatted(.dateTime.month(.wide).year())
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text(monthLabel)
                    .font(.system(size: 22, weight: .medium))
                ForEach(Array(events.enumerated()), id: \.offset) { _, event in
                    HStack(spacing: 12) {
                        RoundedRectangle(cornerRadius: 3).fill(Color.accentColor).frame(width: 4, height: 36)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(event["title"]?.stringValue ?? "").font(.system(size: 16, weight: .medium))
                            Text(dateRange(event)).font(.caption).foregroundStyle(.secondary)
                        }
                        Spacer()
                    }
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 70)
            .padding(.bottom, 80)
        }
        .background(Color(.systemBackground))
    }

    private func dateRange(_ event: JSONValue) -> String {
        let start = event["startDate"]?.stringValue ?? ""
        let end = event["endDate"]?.stringValue ?? ""
        return start == end ? start : "\(start) – \(end)"
    }
}
