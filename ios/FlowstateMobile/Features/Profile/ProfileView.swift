import SwiftUI

struct ProfileView: View {
    @EnvironmentObject private var auth: AuthViewModel

    var body: some View {
        NavigationStack {
            List {
                Section {
                    Button(role: .destructive) {
                        Task { await auth.signOut() }
                    } label: {
                        Label("Sign out", systemImage: "rectangle.portrait.and.arrow.right")
                    }
                }
                Section {
                    LabeledContent("Version", value: "0.1.0 · V1")
                    LabeledContent("Mode", value: "Read-only")
                }
            }
            .navigationTitle("You")
        }
    }
}
