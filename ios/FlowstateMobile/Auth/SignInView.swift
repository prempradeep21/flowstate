import SwiftUI

struct SignInView: View {
    @EnvironmentObject private var auth: AuthViewModel
    @State private var email = ""
    @State private var code = ""
    @State private var showEmailFlow = false

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

                if showEmailFlow {
                    emailFlow
                } else {
                    primaryButtons
                }

                if let error = auth.errorMessage {
                    Text(error)
                        .font(.caption)
                        .foregroundStyle(.white)
                        .multilineTextAlignment(.center)
                }

                Button {
                    auth.enterDemo()
                } label: {
                    Text("View sample artifacts")
                        .font(.footnote.weight(.medium))
                        .foregroundStyle(.white)
                        .underline()
                }
                .padding(.top, 6)

                Text("Read-only · V1")
                    .font(.caption2)
                    .foregroundStyle(.white.opacity(0.6))
                    .padding(.top, 4)
            }
            .padding(.horizontal, 28)
            .padding(.bottom, 24)
        }
    }

    private var primaryButtons: some View {
        VStack(spacing: 11) {
            Button {
                Task { await auth.signInWithGoogle() }
            } label: {
                Label("Continue with Google", systemImage: "g.circle.fill")
                    .font(.system(size: 15, weight: .medium))
                    .frame(maxWidth: .infinity).padding(.vertical, 14)
            }
            .glassChrome(cornerRadius: 24)
            .foregroundStyle(.white)

            Button {
                auth.resetEmailFlow()
                withAnimation { showEmailFlow = true }
            } label: {
                Label("Continue with email", systemImage: "envelope.fill")
                    .font(.system(size: 15, weight: .medium))
                    .frame(maxWidth: .infinity).padding(.vertical, 14)
            }
            .glassChrome(cornerRadius: 24)
            .foregroundStyle(.white)
        }
    }

    private var emailFlow: some View {
        VStack(spacing: 11) {
            if !auth.otpSent {
                TextField("you@example.com", text: $email)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .keyboardType(.emailAddress)
                    .foregroundStyle(.white)
                    .padding(.vertical, 12).padding(.horizontal, 16)
                    .glassChrome(cornerRadius: 24)

                Button {
                    Task { await auth.sendEmailCode(email) }
                } label: {
                    label("Email me a code")
                }
                .glassChrome(cornerRadius: 24)
                .foregroundStyle(.white)
                .disabled(auth.busy || email.isEmpty)
            } else {
                Text("Enter the 6-digit code sent to \(email)")
                    .font(.caption).foregroundStyle(.white.opacity(0.9))
                    .multilineTextAlignment(.center)

                TextField("123456", text: $code)
                    .keyboardType(.numberPad)
                    .multilineTextAlignment(.center)
                    .font(.system(size: 20, weight: .medium, design: .monospaced))
                    .foregroundStyle(.white)
                    .padding(.vertical, 12).padding(.horizontal, 16)
                    .glassChrome(cornerRadius: 24)

                Button {
                    Task { await auth.verifyEmailCode(email: email, code: code) }
                } label: {
                    label("Verify & sign in")
                }
                .glassChrome(cornerRadius: 24)
                .foregroundStyle(.white)
                .disabled(auth.busy || code.count < 6)
            }

            Button("Back") {
                auth.resetEmailFlow()
                withAnimation { showEmailFlow = false; code = "" }
            }
            .font(.caption)
            .foregroundStyle(.white.opacity(0.8))
            .padding(.top, 2)
        }
    }

    private func label(_ text: String) -> some View {
        HStack {
            if auth.busy { ProgressView().tint(.white) }
            Text(text).font(.system(size: 15, weight: .medium))
        }
        .frame(maxWidth: .infinity).padding(.vertical, 14)
    }
}
