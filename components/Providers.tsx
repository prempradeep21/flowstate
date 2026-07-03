"use client";

import { AppToastHost } from "@/components/AppToastHost";
import { AuthProvider } from "@/components/AuthProvider";
import { GoogleOAuthReturnBridge } from "@/components/google/GoogleOAuthReturnBridge";
import { CanvasInactivityBridge } from "@/components/CanvasInactivityBridge";
import { CanvasSoundBridge } from "@/components/CanvasSoundBridge";
import { MotionProvider } from "@/lib/motion/MotionProvider";
import { ThemeProvider } from "@/lib/design/theme/ThemeProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionProvider>
      <ThemeProvider />
      <AuthProvider>
        <AppToastHost />
        <CanvasSoundBridge />
        <CanvasInactivityBridge />
        <GoogleOAuthReturnBridge />
        <div className="relative h-full w-full">{children}</div>
      </AuthProvider>
    </MotionProvider>
  );
}
