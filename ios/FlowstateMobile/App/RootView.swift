import SwiftUI

/// Switches between the sign-in screen and the main tab shell based on auth
/// state (or demo mode).
struct RootView: View {
    @EnvironmentObject private var auth: AuthViewModel

    /// Launch with `--demo` to enter the app with bundled sample data, no sign-in.
    private let demoMode = CommandLine.arguments.contains("--demo")

    var body: some View {
        Group {
            if auth.demoActive || auth.state == .signedIn {
                MainTabView()
            } else if auth.state == .loading {
                ProgressView().controlSize(.large)
            } else {
                SignInView()
            }
        }
        .animation(.easeInOut(duration: 0.25), value: auth.state)
        .animation(.easeInOut(duration: 0.25), value: auth.demoActive)
        .task {
            if demoMode {
                auth.enterDemo()
            } else {
                await auth.restoreSession()
            }
        }
    }
}
