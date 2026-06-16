import SwiftUI

/// Switches between the sign-in screen and the main tab shell based on auth state.
struct RootView: View {
    @EnvironmentObject private var auth: AuthViewModel

    var body: some View {
        Group {
            switch auth.state {
            case .loading:
                ProgressView()
                    .controlSize(.large)
            case .signedOut:
                SignInView()
            case .signedIn:
                MainTabView()
            }
        }
        .animation(.easeInOut(duration: 0.25), value: auth.state)
        .task { await auth.restoreSession() }
    }
}
