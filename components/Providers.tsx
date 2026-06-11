"use client";

import { AuthProvider } from "@/components/AuthProvider";
import { GoogleOAuthReturnBridge } from "@/components/google/GoogleOAuthReturnBridge";
import { CanvasInactivityBridge } from "@/components/CanvasInactivityBridge";
import { CanvasSoundBridge } from "@/components/CanvasSoundBridge";
import { LocalReadOnlyBanner } from "@/components/LocalReadOnlyBanner";
import { MotionProvider } from "@/lib/motion/MotionProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionProvider>
      <AuthProvider>
        <CanvasSoundBridge />
        <CanvasInactivityBridge />
        <GoogleOAuthReturnBridge />
        <div className="relative h-full w-full">
          {children}
          <LocalReadOnlyBanner />
        </div>
      </AuthProvider>
    </MotionProvider>
  );
}
