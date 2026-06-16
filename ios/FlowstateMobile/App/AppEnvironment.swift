import Foundation

/// Reads configuration injected from `Config/Secrets.xcconfig` via Info.plist.
/// Mirrors the web app's `NEXT_PUBLIC_SUPABASE_*` values.
enum AppEnvironment {
    private static func plistString(_ key: String) -> String {
        guard let value = Bundle.main.object(forInfoDictionaryKey: key) as? String,
              !value.isEmpty,
              !value.hasPrefix("YOUR_") else {
            assertionFailure("Missing Info.plist value for \(key). Did you fill in Config/Secrets.xcconfig?")
            return ""
        }
        return value
    }

    /// Full Supabase project URL (host stored in xcconfig; https prepended here
    /// because xcconfig treats `//` as a comment).
    static var supabaseURL: URL {
        URL(string: "https://\(plistString("SUPABASE_HOST"))")!
    }

    static var supabaseAnonKey: String {
        plistString("SUPABASE_ANON_KEY")
    }

    /// Base URL of the deployed web app, used by the WKWebView artifact viewer.
    static var webBaseURL: URL {
        URL(string: "https://\(plistString("WEB_HOST"))")!
    }

    /// Custom URL scheme registered for OAuth callbacks.
    static var oauthRedirectURL: URL {
        let scheme = plistString("OAUTH_REDIRECT_SCHEME")
        return URL(string: "\(scheme)://auth-callback")!
    }
}
