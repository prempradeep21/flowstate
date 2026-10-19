"use client";

import { AppToastHost } from "@/components/AppToastHost";
import { AuthProvider } from "@/components/AuthProvider";
import { GoogleOAuthReturnBridge } from "@/components/google/GoogleOAuthReturnBridge";
import { HoverHint } from "@/components/HoverHint";
import { MotionProvider } from "@/lib/motion/MotionProvider";
import { ThemeProvider } from "@/lib/design/theme/ThemeProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionProvider>
      <ThemeProvider />
      <AuthProvider>
        <AppToastHost />
        <HoverHint />
        <GoogleOAuthReturnBridge />
        <div className="relative h-full w-full">{children}</div>
      </AuthProvider>
    </MotionProvider>
  );
}
