import Foundation
import Supabase
import AuthenticationServices

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
    /// Set once a 6-digit code has been emailed, so the UI reveals the code field.
    @Published var otpSent = false
    @Published var busy = false
    /// Browse bundled sample data through the real app shell, no sign-in.
    @Published var demoActive = false

    func enterDemo() {
        DemoStore.isActive = true
        demoActive = true
    }

    private let client = SupabaseManager.client
    private var authTask: Task<Void, Never>?
    /// True while the in-app ASWebAuthenticationSession OAuth flow runs, so the
    /// `onOpenURL` deep-link handler doesn't exchange the code a second time
    /// (which would fail PKCE: the verifier is single-use).
    private var oauthInProgress = false

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
        oauthInProgress = true
        defer { oauthInProgress = false }
        do {
            // Presents ASWebAuthenticationSession, captures the callback, and
            // exchanges the code internally — returning the established session.
            // Ephemeral = no shared Safari cookies, so the PKCE flow runs fully
            // (avoids an instant SSO redirect that can skip the code exchange).
            let session = try await client.auth.signInWithOAuth(
                provider: .google,
                redirectTo: AppEnvironment.oauthRedirectURL
            ) { webSession in
                webSession.prefersEphemeralWebBrowserSession = true
            }
            apply(session)
        } catch {
            errorMessage = error.localizedDescription
            NSLog("FLOWSTATE_OAUTH_ERROR \(String(reflecting: error))")
        }
    }

    /// Email a 6-digit one-time code. `shouldCreateUser: false` means it only
    /// signs into an EXISTING account (e.g. the one you made with Google) — it
    /// never creates a new, empty account.
    func sendEmailCode(_ email: String) async {
        let trimmed = email.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        errorMessage = nil
        busy = true
        defer { busy = false }
        do {
            try await client.auth.signInWithOTP(email: trimmed, shouldCreateUser: false)
            otpSent = true
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    /// Verify the emailed 6-digit code and sign in.
    func verifyEmailCode(email: String, code: String) async {
        let trimmedEmail = email.trimmingCharacters(in: .whitespacesAndNewlines)
        let trimmedCode = code.trimmingCharacters(in: .whitespacesAndNewlines)
        errorMessage = nil
        busy = true
        defer { busy = false }
        do {
            let response = try await client.auth.verifyOTP(
                email: trimmedEmail, token: trimmedCode, type: .email
            )
            if case let .session(session) = response {
                apply(session)
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func resetEmailFlow() {
        otpSent = false
        errorMessage = nil
    }

    /// Handle a magic-link deep link delivered via `onOpenURL`. Skipped during
    /// the in-app OAuth flow, which exchanges the code itself.
    func handleOAuthCallback(_ url: URL) async {
        guard !oauthInProgress else { return }
        do {
            let session = try await client.auth.session(from: url)
            apply(session)
        } catch {
            // A stray callback (e.g. already exchanged) — ignore rather than
            // surfacing a PKCE error on a flow that actually succeeded.
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
