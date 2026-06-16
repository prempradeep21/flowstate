import Foundation
import Supabase

@MainActor
final class AuthViewModel: ObservableObject {
    enum State: Equatable {
        case loading
        case signedOut
        case signedIn
    }

    @Published private(set) var state: State = .loading
    @Published private(set) var userId: String?
    @Published var errorMessage: String?

    private let client = SupabaseManager.client
    private var authTask: Task<Void, Never>?

    init() {
        observeAuthChanges()
    }

    /// Restore a persisted session on launch.
    func restoreSession() async {
        do {
            let session = try await client.auth.session
            apply(session)
        } catch {
            state = .signedOut
        }
    }

    func signInWithGoogle() async {
        errorMessage = nil
        do {
            // Presents ASWebAuthenticationSession and completes on callback.
            try await client.auth.signInWithOAuth(
                provider: .google,
                redirectTo: AppEnvironment.oauthRedirectURL
            )
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    /// Email magic link — Supabase emails a deep link back into the app.
    func signInWithEmail(_ email: String) async {
        errorMessage = nil
        do {
            try await client.auth.signInWithOTP(
                email: email,
                redirectTo: AppEnvironment.oauthRedirectURL
            )
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    /// Handle the magic-link / OAuth deep link delivered via `onOpenURL`.
    func handleOAuthCallback(_ url: URL) async {
        do {
            let session = try await client.auth.session(from: url)
            apply(session)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func signOut() async {
        try? await client.auth.signOut()
        userId = nil
        state = .signedOut
    }

    /// The current access token, for authenticating the WKWebView artifact viewer.
    func currentAccessToken() async -> String? {
        try? await client.auth.session.accessToken
    }

    private func observeAuthChanges() {
        authTask = Task { [weak self] in
            guard let self else { return }
            for await change in client.auth.authStateChanges {
                await MainActor.run {
                    switch change.event {
                    case .signedIn, .tokenRefreshed, .initialSession:
                        if let session = change.session {
                            self.apply(session)
                        }
                    case .signedOut:
                        self.userId = nil
                        self.state = .signedOut
                    default:
                        break
                    }
                }
            }
        }
    }

    private func apply(_ session: Session?) {
        guard let session else {
            state = .signedOut
            return
        }
        userId = session.user.id.uuidString.lowercased()
        state = .signedIn
    }
}
