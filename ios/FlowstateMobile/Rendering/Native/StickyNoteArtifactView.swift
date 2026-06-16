import SwiftUI

/// Native sticky-note renderer. Data shape (StickyNoteArtifactData):
///   { text, colorId: "turbo" | "violet" | "haiti" | "chalk" }
struct StickyNoteArtifactView: View {
    let data: JSONValue

    var body: some View {
        ZStack {
            Color(.systemBackground).ignoresSafeArea()
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(noteColor)
                .overlay(
                    Text(data["text"]?.stringValue ?? "")
                        .font(.system(size: 20, weight: .medium))
                        .foregroundStyle(textColor)
                        .multilineTextAlignment(.leading)
                        .padding(24),
                    alignment: .topLeading
                )
                .aspectRatio(1, contentMode: .fit)
                .padding(.horizontal, 32)
        }
    }

    private var noteColor: Color {
        switch data["colorId"]?.stringValue {
        case "turbo":  return Color(red: 1.0, green: 0.86, blue: 0.2)
        case "violet": return Color(red: 0.78, green: 0.7, blue: 0.98)
        case "haiti":  return Color(red: 0.18, green: 0.16, blue: 0.30)
        default:       return Color(red: 0.96, green: 0.96, blue: 0.94) // chalk
        }
    }

    private var textColor: Color {
        data["colorId"]?.stringValue == "haiti" ? .white : Color(red: 0.12, green: 0.12, blue: 0.1)
    }
}
