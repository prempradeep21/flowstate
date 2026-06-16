import SwiftUI

struct SignInView: View {
    @EnvironmentObject private var auth: AuthViewModel
    @State private var email = ""
    @State private var showEmailField = false

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [Color(red: 0.36, green: 0.43, blue: 0.88),
                         Color(red: 0.17, green: 0.61, blue: 0.54)],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            VStack(spacing: 16) {
                Spacer()
                Image(systemName: "square.grid.2x2.fill")
                    .font(.system(size: 40, weight: .medium))
                    .foregroundStyle(.white)
                    .padding(20)
                    .glassChrome(cornerRadius: 20)
                Text("Flowstate")
                    .font(.system(size: 30, weight: .medium))
                    .foregroundStyle(.white)
                Text("Your artifacts, everywhere you are")
                    .font(.subheadline)
                    .foregroundStyle(.white.opacity(0.85))
                Spacer()

                Button {
                    Task { await auth.signInWithGoogle() }
                } label: {
                    Label("Continue with Google", systemImage: "g.circle.fill")
                        .font(.system(size: 15, weight: .medium))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                }
                .glassChrome(cornerRadius: 24)
                .foregroundStyle(.white)

                if showEmailField {
                    TextField("you@example.com", text: $email)
                        .textInputAutocapitalization(.never)
                        .keyboardType(.emailAddress)
                        .padding(.vertical, 12)
                        .padding(.horizontal, 14)
                        .glassChrome(cornerRadius: 24)
                        .foregroundStyle(.white)
                    Button {
                        Task { await auth.signInWithEmail(email) }
                    } label: {
                        Text("Send magic link")
                            .font(.system(size: 15, weight: .medium))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                    }
                    .glassChrome(cornerRadius: 24)
                    .foregroundStyle(.white)
                } else {
                    Button {
                        withAnimation { showEmailField = true }
                    } label: {
                        Label("Continue with email", systemImage: "envelope.fill")
                            .font(.system(size: 15, weight: .medium))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                    }
                    .glassChrome(cornerRadius: 24)
                    .foregroundStyle(.white)
                }

                if let error = auth.errorMessage {
                    Text(error)
                        .font(.caption)
                        .foregroundStyle(.white.opacity(0.9))
                        .multilineTextAlignment(.center)
                }

                Text("Read-only · V1")
                    .font(.caption2)
                    .foregroundStyle(.white.opacity(0.6))
                    .padding(.top, 4)
            }
            .padding(.horizontal, 28)
            .padding(.bottom, 24)
        }
    }
}
