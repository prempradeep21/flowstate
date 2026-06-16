import Foundation
import Supabase

/// Single shared Supabase client, configured from `AppEnvironment`.
/// Reuses the same project + RLS policies as the web and Mac apps.
enum SupabaseManager {
    static let client: SupabaseClient = SupabaseClient(
        supabaseURL: AppEnvironment.supabaseURL,
        supabaseKey: AppEnvironment.supabaseAnonKey
    )
}
