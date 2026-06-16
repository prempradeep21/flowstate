import SwiftUI

/// Apple Liquid Glass for the app's floating control chrome ONLY
/// (tab bar, feed top bar, action dock). Never applied to artifact content
/// or to list pages — those stay visually identical to the web app.
///
/// Uses the real iOS 26 `.glassEffect`; falls back to `.ultraThinMaterial`
/// on iOS 17–25 so the project still builds and runs on current toolchains.
struct GlassChromeModifier: ViewModifier {
    let cornerRadius: CGFloat

    func body(content: Content) -> some View {
        let shape = RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
        if #available(iOS 26.0, *) {
            content.glassEffect(.regular.interactive(), in: shape)
        } else {
            content
                .background(.ultraThinMaterial, in: shape)
                .overlay(shape.strokeBorder(.white.opacity(0.4), lineWidth: 0.5))
                .shadow(color: .black.opacity(0.12), radius: 10, y: 4)
        }
    }
}

extension View {
    /// Apply Liquid Glass chrome with the given corner radius.
    func glassChrome(cornerRadius: CGFloat = 22) -> some View {
        modifier(GlassChromeModifier(cornerRadius: cornerRadius))
    }
}
