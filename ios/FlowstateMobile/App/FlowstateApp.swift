import SwiftUI

@main
struct FlowstateApp: App {
    @StateObject private var auth = AuthViewModel()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(auth)
                .preferredColorScheme(nil) // follow system; artifacts render web-identical
                .onOpenURL { url in
                    Task { await auth.handleOAuthCallback(url) }
                }
        }
    }
}
