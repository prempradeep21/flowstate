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

    /// Normalize a host value: strip any pasted scheme and slashes so a value
    /// like "https://x.supabase.co" or "x.supabase.co/" still works. (xcconfig
    /// truncates `//`, so host-only is required — this is belt-and-suspenders.)
    private static func host(_ key: String) -> String {
        var value = plistString(key)
        for prefix in ["https://", "http://", "https:", "http:"] where value.hasPrefix(prefix) {
            value.removeFirst(prefix.count)
        }
        return value.trimmingCharacters(in: CharacterSet(charactersIn: "/ "))
    }

    /// Full Supabase project URL (host stored in xcconfig; https prepended here
    /// because xcconfig treats `//` as a comment).
    static var supabaseURL: URL {
        URL(string: "https://\(host("SUPABASE_HOST"))")!
    }

    static var supabaseAnonKey: String {
        plistString("SUPABASE_ANON_KEY")
    }

    /// Base URL of the web app, used by the WKWebView artifact renderer.
    /// A host with an explicit port (localhost:3001, 192.168.x.x:3001) is a dev
    /// server → http; a bare host (flowstatetool.com) → https.
    static var webBaseURL: URL {
        let h = host("WEB_HOST")
        let scheme = h.contains(":") ? "http" : "https"
        return URL(string: "\(scheme)://\(h)")!
    }

    /// Custom URL scheme registered for OAuth callbacks.
    static var oauthRedirectURL: URL {
        let scheme = plistString("OAUTH_REDIRECT_SCHEME")
        return URL(string: "\(scheme)://auth-callback")!
    }
}
